const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const phyllo = require('../services/phyllo')

const router = express.Router()

function signToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/agency/signup
router.post('/agency/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' })
    }

    const existing = await pool.query('SELECT id FROM agencies WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO agencies (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email.toLowerCase(), passwordHash]
    )

    const agency = result.rows[0]
    const token = signToken(agency.id, 'agency')
    res.json({ success: true, data: { token, agency } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to create account' })
  }
})

// POST /api/auth/agency/login
router.post('/agency/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }

    const result = await pool.query('SELECT * FROM agencies WHERE email = $1', [email.toLowerCase()])
    const agency = result.rows[0]
    if (!agency) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, agency.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const token = signToken(agency.id, 'agency')
    res.json({
      success: true,
      data: { token, agency: { id: agency.id, name: agency.name, email: agency.email } },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to log in' })
  }
})

// POST /api/auth/influencer/accept-invite
router.post('/influencer/accept-invite', async (req, res) => {
  try {
    const { token, name, password } = req.body
    if (!token || !name || !password) {
      return res.status(400).json({ success: false, error: 'Token, name and password are required' })
    }

    const result = await pool.query('SELECT * FROM influencers WHERE invite_token = $1', [token])
    const influencer = result.rows[0]
    if (!influencer) {
      return res.status(404).json({ success: false, error: 'Invalid or expired invite link' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const phylloUser = await phyllo.createPhylloUser(influencer.id, name)

    const updated = await pool.query(
      `UPDATE influencers
       SET name = $1, password_hash = $2, phyllo_user_id = $3
       WHERE id = $4
       RETURNING id, email, name, phyllo_user_id, platform_connected, invited_by_agency_id`,
      [name, passwordHash, phylloUser ? phylloUser.id : influencer.phyllo_user_id, influencer.id]
    )

    const authToken = signToken(updated.rows[0].id, 'influencer')
    res.json({ success: true, data: { token: authToken, influencer: updated.rows[0] } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to accept invite' })
  }
})

// GET /api/auth/invite/:token - validate invite + return agency name (for join screen)
router.get('/invite/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT influencers.id, influencers.email, influencers.name, agencies.name AS agency_name
       FROM influencers
       JOIN agencies ON agencies.id = influencers.invited_by_agency_id
       WHERE invite_token = $1`,
      [req.params.token]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invalid or expired invite link' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to validate invite' })
  }
})

// POST /api/auth/influencer/login
router.post('/influencer/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }

    const result = await pool.query('SELECT * FROM influencers WHERE email = $1', [email.toLowerCase()])
    const influencer = result.rows[0]
    if (!influencer || !influencer.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, influencer.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' })
    }

    const token = signToken(influencer.id, 'influencer')
    res.json({
      success: true,
      data: {
        token,
        influencer: {
          id: influencer.id,
          name: influencer.name,
          email: influencer.email,
          platform_connected: influencer.platform_connected,
        },
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to log in' })
  }
})

module.exports = router
