const express = require('express')
const crypto = require('crypto')
const pool = require('../db')
const { syncInfluencerAnalytics } = require('../services/analyticsSync')

const router = express.Router()

function verifySignature(rawBody, signature) {
  if (!process.env.PHYLLO_WEBHOOK_SECRET || !signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.PHYLLO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

async function handleAccountConnected(payload) {
  const externalId = payload.user_id || payload.external_id
  const accountId = payload.account_id
  const username = payload.username || payload.handle

  const result = await pool.query(
    `UPDATE influencers
     SET phyllo_account_id = $1, platform_connected = true,
         instagram_handle = COALESCE($2, instagram_handle)
     WHERE phyllo_user_id = $3
     RETURNING id, phyllo_account_id, instagram_handle`,
    [accountId, username, externalId]
  )

  const influencer = result.rows[0]
  if (influencer) {
    await syncInfluencerAnalytics(influencer.id, influencer.phyllo_account_id, influencer.instagram_handle)
  }
}

async function handleDataUpdated(payload) {
  const accountId = payload.account_id
  if (!accountId) return

  const result = await pool.query(
    'SELECT id, instagram_handle FROM influencers WHERE phyllo_account_id = $1',
    [accountId]
  )
  const influencer = result.rows[0]
  if (influencer) {
    await syncInfluencerAnalytics(influencer.id, accountId, influencer.instagram_handle)
  }
}

// POST /api/webhooks/phyllo
// Uses express.raw() (mounted in index.js) so we can verify the HMAC signature
// against the exact request bytes before parsing JSON.
router.post('/phyllo', async (req, res) => {
  const signature = req.headers['x-phyllo-signature']
  const rawBody = req.body // Buffer, thanks to express.raw()

  if (process.env.PHYLLO_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
    return res.status(401).json({ success: false, error: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' })
  }

  // Respond immediately; process asynchronously.
  res.status(200).json({ success: true })

  setImmediate(async () => {
    try {
      const eventId = event.id || event.event_id || crypto.randomUUID()
      const eventType = event.event_type || event.type

      const alreadyLogged = await pool.query(
        'SELECT id FROM webhook_events WHERE phyllo_event_id = $1',
        [eventId]
      )
      if (alreadyLogged.rows.length > 0) return

      await pool.query(
        'INSERT INTO webhook_events (phyllo_event_id, event_type, payload) VALUES ($1, $2, $3)',
        [eventId, eventType, event]
      )

      const payload = event.data || event

      if (eventType === 'accounts.connected') {
        await handleAccountConnected(payload)
      } else if (eventType === 'identity.updated' || eventType === 'engagement.updated') {
        await handleDataUpdated(payload)
      }
    } catch (err) {
      console.error('Failed to process Phyllo webhook:', err)
    }
  })
})

module.exports = router
