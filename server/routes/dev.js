const express = require('express')
const pool = require('../db')
const { syncInfluencerAnalytics } = require('../services/analyticsSync')

const router = express.Router()

// POST /api/dev/simulate-connect/:influencerId
// Dev-only helper: manually mark an influencer as connected and fetch mock
// analytics, for local testing without real Phyllo webhooks configured.
router.post('/simulate-connect/:influencerId', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE influencers
       SET platform_connected = true,
           phyllo_account_id = COALESCE(phyllo_account_id, 'sandbox-' || id),
           instagram_handle = COALESCE(instagram_handle, split_part(email, '@', 1))
       WHERE id = $1
       RETURNING id, phyllo_account_id, instagram_handle`,
      [req.params.influencerId]
    )
    const influencer = result.rows[0]
    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' })
    }

    await syncInfluencerAnalytics(influencer.id, influencer.phyllo_account_id, influencer.instagram_handle)

    res.json({ success: true, data: { id: influencer.id } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to simulate connection' })
  }
})

module.exports = router
