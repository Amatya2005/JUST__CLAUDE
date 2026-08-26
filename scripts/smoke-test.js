/**
 * Boots the API and walks the golden path against a real database:
 * agency signup -> campaign -> invite -> accept -> connect -> analytics.
 *
 * Requires DATABASE_URL and JWT_SECRET. Exits non-zero on the first failure.
 */
const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.PORT || 4000
const BASE = `http://127.0.0.1:${PORT}`

let passed = 0
const failures = []

function check(name, condition, detail) {
  if (condition) {
    passed++
    console.log(`  ok  ${name}`)
  } else {
    failures.push(name)
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function request(method, endpoint, { body, token } = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function waitForHealth(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return true
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

async function run() {
  const stamp = Date.now()

  const signup = await request('POST', '/api/auth/agency/signup', {
    body: { name: 'Smoke Agency', email: `smoke${stamp}@test.com`, password: 'password123' },
  })
  check('agency signup returns a token', Boolean(signup.json?.data?.token), `status ${signup.status}`)
  const token = signup.json?.data?.token
  if (!token) return

  const dupe = await request('POST', '/api/auth/agency/signup', {
    body: { name: 'Smoke Agency', email: `smoke${stamp}@test.com`, password: 'password123' },
  })
  check('duplicate signup is rejected', dupe.status === 409, `status ${dupe.status}`)

  const badLogin = await request('POST', '/api/auth/agency/login', {
    body: { email: `smoke${stamp}@test.com`, password: 'wrong-password' },
  })
  check('wrong password is rejected', badLogin.status === 401, `status ${badLogin.status}`)

  const noAuth = await request('GET', '/api/campaigns')
  check('unauthenticated campaign list is rejected', noAuth.status === 401, `status ${noAuth.status}`)

  const campaign = await request('POST', '/api/campaigns', {
    token,
    body: { name: 'Smoke Campaign', description: 'CI', start_date: '2026-01-01', end_date: '2026-02-01' },
  })
  const campaignId = campaign.json?.data?.id
  check('campaign is created', Boolean(campaignId), `status ${campaign.status}`)
  if (!campaignId) return

  const invite = await request('POST', '/api/influencers/invite', {
    token,
    body: { email: `creator${stamp}@test.com`, campaign_id: campaignId },
  })
  const inviteLink = invite.json?.data?.invite_link
  check('invite link is returned', Boolean(inviteLink), `status ${invite.status}`)
  check('invite link is absolute', /^https?:\/\/.+\/join\?token=/.test(inviteLink || ''), inviteLink)
  if (!inviteLink) return

  const inviteToken = inviteLink.split('token=')[1]

  const inviteLookup = await request('GET', `/api/auth/invite/${inviteToken}`)
  check('invite resolves to the inviting agency', inviteLookup.json?.data?.agency_name === 'Smoke Agency')

  const badInvite = await request('GET', '/api/auth/invite/not-a-real-token')
  check('unknown invite token 404s', badInvite.status === 404, `status ${badInvite.status}`)

  const accept = await request('POST', '/api/auth/influencer/accept-invite', {
    body: { token: inviteToken, name: 'Smoke Creator', password: 'password123' },
  })
  const influencerId = accept.json?.data?.influencer?.id
  check('invite is accepted', Boolean(influencerId), `status ${accept.status}`)
  if (!influencerId) return

  const influencerLogin = await request('POST', '/api/auth/influencer/login', {
    body: { email: `creator${stamp}@test.com`, password: 'password123' },
  })
  check('influencer can log in', Boolean(influencerLogin.json?.data?.token), `status ${influencerLogin.status}`)

  // Exercises the same sync path the webhook uses. Phyllo calls fail without
  // credentials and fall back to generated data, which is the degradation
  // path worth covering.
  const connect = await request('POST', `/api/dev/simulate-connect/${influencerId}`)
  check('simulated connect succeeds', connect.json?.success === true, `status ${connect.status}`)

  const detail = await request('GET', `/api/campaigns/${campaignId}`, { token })
  const roster = detail.json?.data?.influencers || []
  check('roster contains the influencer', roster.length === 1, `got ${roster.length}`)
  check(
    'analytics are stored and returned',
    roster[0]?.follower_count != null,
    JSON.stringify(roster[0] ?? {}).slice(0, 120)
  )
  check('influencer is marked connected', roster[0]?.platform_connected === true)

  const overview = await request('GET', '/api/analytics/overview', { token })
  check('overview reports the campaign', Number(overview.json?.data?.total_campaigns) >= 1)

  const aggregate = await request('GET', `/api/analytics/campaign/${campaignId}`, { token })
  check('campaign aggregate reports reach', Number(aggregate.json?.data?.total_reach) > 0)

  const discovery = await request('GET', '/api/discovery/search?q=fitness&limit=3')
  check('discovery returns results', Array.isArray(discovery.json?.data) && discovery.json.data.length > 0)

  const unknownApi = await request('GET', '/api/does-not-exist')
  check('unknown API route returns JSON 404', unknownApi.status === 404 && unknownApi.json?.success === false)
}

async function main() {
  const server = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..', 'server'),
    env: { ...process.env, RUN_MIGRATIONS_ON_BOOT: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const serverLog = []
  server.stdout.on('data', (d) => serverLog.push(d.toString()))
  server.stderr.on('data', (d) => serverLog.push(d.toString()))
  server.on('exit', (code) => {
    if (code !== null && code !== 0 && failures.length === 0) {
      console.error(`Server exited early with code ${code}`)
      console.error(serverLog.join(''))
      process.exit(1)
    }
  })

  try {
    if (!(await waitForHealth())) {
      console.error('Server never became healthy. Output:')
      console.error(serverLog.join(''))
      process.exit(1)
    }

    console.log('Running smoke tests...')
    await run()
  } finally {
    server.kill()
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length > 0) {
    console.error('Server output:\n' + serverLog.join(''))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
