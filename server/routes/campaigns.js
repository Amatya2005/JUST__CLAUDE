const express = require('express')
const pool = require('../db')
const { verifyToken, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken, requireRole('agency'))

// GET /api/campaigns - list agency's campaigns with influencer count
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              COUNT(ci.influencer_id) AS influencer_count
       FROM campaigns c
       LEFT JOIN campaign_influencers ci ON ci.campaign_id = c.id
       WHERE c.agency_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load campaigns' })
  }
})

// POST /api/campaigns - create campaign
router.post('/', async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body
    if (!name) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' })
    }

    const result = await pool.query(
      `INSERT INTO campaigns (agency_id, name, description, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'active'))
       RETURNING *`,
      [req.user.id, name, description || null, start_date || null, end_date || null, status || null]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create campaign' })
  }
})

// GET /api/campaigns/:id - get campaign + its influencers + latest analytics
router.get('/:id', async (req, res) => {
  try {
    const campaignResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1 AND agency_id = $2',
      [req.params.id, req.user.id]
    )
    const campaign = campaignResult.rows[0]
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' })
    }

    const influencersResult = await pool.query(
      `SELECT i.id, i.name, i.email, i.instagram_handle, i.platform_connected,
              a.follower_count, a.following_count, a.post_count, a.engagement_rate,
              a.avg_likes, a.avg_comments, a.avg_views, a.audience_quality_score,
              a.fake_follower_pct, a.top_country, a.gender_female_pct, a.gender_male_pct,
              a.age_13_17_pct, a.age_18_24_pct, a.age_25_34_pct, a.age_35_44_pct, a.age_45_plus_pct,
              a.is_verified, a.bio, a.profile_url, a.fetched_at
       FROM campaign_influencers ci
       JOIN influencers i ON i.id = ci.influencer_id
       LEFT JOIN LATERAL (
         SELECT * FROM influencer_analytics
         WHERE influencer_id = i.id
         ORDER BY fetched_at DESC
         LIMIT 1
       ) a ON true
       WHERE ci.campaign_id = $1
       ORDER BY ci.added_at ASC`,
      [campaign.id]
    )

    res.json({ success: true, data: { campaign, influencers: influencersResult.rows } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load campaign' })
  }
})

// DELETE /api/campaigns/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 AND agency_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' })
    }
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to delete campaign' })
  }
})

module.exports = router
