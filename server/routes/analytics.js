const express = require('express')
const pool = require('../db')
const { verifyToken, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken, requireRole('agency'))

// GET /api/analytics/overview - agency-wide summary stats
router.get('/overview', async (req, res) => {
  try {
    const result = await pool.query(
      `WITH roster AS (
         SELECT DISTINCT i.id, i.platform_connected
         FROM campaigns c
         JOIN campaign_influencers ci ON ci.campaign_id = c.id
         JOIN influencers i ON i.id = ci.influencer_id
         WHERE c.agency_id = $1
       )
       SELECT
         (SELECT COUNT(*) FROM campaigns WHERE agency_id = $1) AS total_campaigns,
         (SELECT COUNT(*) FROM roster) AS total_influencers,
         (SELECT COUNT(*) FROM roster WHERE platform_connected) AS connected_influencers,
         (SELECT COALESCE(AVG(a.engagement_rate), 0)
            FROM roster r
            JOIN LATERAL (
              SELECT engagement_rate FROM influencer_analytics
              WHERE influencer_id = r.id
              ORDER BY fetched_at DESC LIMIT 1
            ) a ON true
          ) AS avg_engagement_rate`,
      [req.user.id]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load overview' })
  }
})

// GET /api/analytics/influencer/:influencerId
router.get('/influencer/:influencerId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.* FROM influencer_analytics a
       JOIN influencers i ON i.id = a.influencer_id
       WHERE a.influencer_id = $1
       ORDER BY a.fetched_at DESC LIMIT 1`,
      [req.params.influencerId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No analytics found for this influencer' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load analytics' })
  }
})

// GET /api/analytics/campaign/:campaignId - aggregated analytics
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const campaignCheck = await pool.query(
      'SELECT id FROM campaigns WHERE id = $1 AND agency_id = $2',
      [req.params.campaignId, req.user.id]
    )
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' })
    }

    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT i.id) AS total_influencers,
         COUNT(DISTINCT i.id) FILTER (WHERE i.platform_connected) AS connected_influencers,
         COALESCE(SUM(a.follower_count), 0) AS total_reach,
         COALESCE(AVG(a.engagement_rate), 0) AS avg_engagement_rate
       FROM campaign_influencers ci
       JOIN influencers i ON i.id = ci.influencer_id
       LEFT JOIN LATERAL (
         SELECT * FROM influencer_analytics
         WHERE influencer_id = i.id
         ORDER BY fetched_at DESC LIMIT 1
       ) a ON true
       WHERE ci.campaign_id = $1`,
      [req.params.campaignId]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load campaign analytics' })
  }
})

module.exports = router
