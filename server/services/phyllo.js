const fetch = require('node-fetch')

const BASE_URL = process.env.PHYLLO_BASE_URL || 'https://api.sandbox.insightiq.ai'
const INSTAGRAM_WORK_PLATFORM_ID = '9bb8913b-ddd9-430b-a66a-d74d846e6c66'

function authHeader() {
  const creds = `${process.env.PHYLLO_CLIENT_ID}:${process.env.PHYLLO_SECRET}`
  return `Basic ${Buffer.from(creds).toString('base64')}`
}

async function phylloRequest(method, path, { body, query } = {}) {
  let url = `${BASE_URL}${path}`
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`Phyllo API error [${method} ${path}]: ${res.status} ${text}`)
      return null
    }

    return await res.json()
  } catch (err) {
    console.error(`Phyllo API request failed [${method} ${path}]:`, err.message)
    return null
  }
}

// 1. Create a Phyllo user for an influencer
async function createPhylloUser(influencerId, name) {
  return phylloRequest('POST', '/v1/users', {
    body: { name, external_id: influencerId },
  })
}

// 2. Create an SDK token so the frontend can open the Linkage SDK
async function createSdkToken(phylloUserId) {
  return phylloRequest('POST', '/v1/sdk-tokens', {
    body: {
      user_id: phylloUserId,
      products: ['IDENTITY', 'ENGAGEMENT', 'AUDIENCE'],
    },
  })
}

// 3. Fetch creator profile (after account connected)
async function fetchProfile(phylloAccountId) {
  return phylloRequest('GET', '/v1/social/profiles', {
    query: { account_id: phylloAccountId },
  })
}

// 4. Fetch audience data
async function fetchAudience(phylloAccountId) {
  return phylloRequest('GET', '/v1/social/profiles/audience', {
    query: { account_id: phylloAccountId },
  })
}

// 5. Fetch recent content
async function fetchContent(phylloAccountId, limit = 20) {
  return phylloRequest('GET', '/v1/social/contents', {
    query: { account_id: phylloAccountId, limit },
  })
}

// 6. Public creator search (Discovery tab)
async function searchPublicCreators(query, platform = 'instagram', filters = {}) {
  return phylloRequest('GET', '/v1/public/social/creators/search', {
    query: {
      query,
      platform,
      work_platform_id: platform === 'instagram' ? INSTAGRAM_WORK_PLATFORM_ID : undefined,
      min_follower_count: filters.minFollowers,
      max_follower_count: filters.maxFollowers,
      min_engagement_rate: filters.minEngagement,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    },
  })
}

module.exports = {
  INSTAGRAM_WORK_PLATFORM_ID,
  createPhylloUser,
  createSdkToken,
  fetchProfile,
  fetchAudience,
  fetchContent,
  searchPublicCreators,
}
