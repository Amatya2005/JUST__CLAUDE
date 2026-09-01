const express = require('express')
const crypto = require('crypto')
const pool = require('../db')
const phyllo = require('../services/phyllo')
const { verifyToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// POST /api/influencers/invite - agency invites influencer by email (auth: agency)
router.post('/invite', verifyToken, requireRole('agency'), async (req, res) => {
  try {
    const { email, campaign_id } = req.body
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' })
    }

    if (campaign_id) {
      const campaignCheck = await pool.query(
        'SELECT id FROM campaigns WHERE id = $1 AND agency_id = $2',
        [campaign_id, req.user.id]
      )
      if (campaignCheck.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Campaign not found' })
      }
    }

    const normalizedEmail = email.toLowerCase()
    let influencer

    const existing = await pool.query('SELECT * FROM influencers WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0) {
      influencer = existing.rows[0]
    } else {
      const inviteToken = crypto.randomUUID()
      const inserted = await pool.query(
        `INSERT INTO influencers (email, invite_token, invited_by_agency_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [normalizedEmail, inviteToken, req.user.id]
      )
      influencer = inserted.rows[0]
    }

    if (campaign_id) {
      await pool.query(
        `INSERT INTO campaign_influencers (campaign_id, influencer_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [campaign_id, influencer.id]
      )
    }

    // Falls back to the origin this request arrived on, so a single-service
    // deploy produces working invite links even before FRONTEND_URL is set.
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
    const inviteLink = influencer.invite_token
      ? `${baseUrl}/join?token=${influencer.invite_token}`
      : null

    res.json({
      success: true,
      data: {
        influencer: { id: influencer.id, email: influencer.email },
        invite_link: inviteLink,
        already_joined: !influencer.invite_token,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to send invite' })
  }
})

// POST /api/influencers/sdk-token (auth: influencer)
router.post('/sdk-token', verifyToken, requireRole('influencer'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM influencers WHERE id = $1', [req.user.id])
    const influencer = result.rows[0]
    if (!influencer || !influencer.phyllo_user_id) {
      return res.status(400).json({ success: false, error: 'Influencer is not set up with Phyllo yet' })
    }

    const tokenData = await phyllo.createSdkToken(influencer.phyllo_user_id)
    if (!tokenData) {
      return res.status(502).json({ success: false, error: 'Failed to generate connect token' })
    }

    res.json({ success: true, data: tokenData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to generate connect token' })
  }
})

// GET /api/influencers/me (auth: influencer)
router.get('/me', verifyToken, requireRole('influencer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.name, i.email, i.instagram_handle, i.platform_connected, i.phyllo_user_id,
              a.name AS agency_name
       FROM influencers i
       LEFT JOIN agencies a ON a.id = i.invited_by_agency_id
       WHERE i.id = $1`,
      [req.user.id]
    )
    const influencer = result.rows[0]
    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Influencer not found' })
    }

    const campaigns = await pool.query(
      `SELECT c.id, c.name, c.status, c.start_date, c.end_date, ag.name AS agency_name
       FROM campaign_influencers ci
       JOIN campaigns c ON c.id = ci.campaign_id
       JOIN agencies ag ON ag.id = c.agency_id
       WHERE ci.influencer_id = $1
       ORDER BY ci.added_at DESC`,
      [req.user.id]
    )

    res.json({ success: true, data: { influencer, campaigns: campaigns.rows } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to load profile' })
  }
})

module.exports = router
