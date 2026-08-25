const express = require('express')
const phyllo = require('../services/phyllo')
const { generateMockSearchResults } = require('../services/mockData')

const router = express.Router()

// GET /api/discovery/search?q=&platform=instagram&minFollowers=&maxFollowers=&minEngagement=
router.get('/search', async (req, res) => {
  try {
    const { q = '', platform = 'instagram', minFollowers, maxFollowers, minEngagement, limit, offset } = req.query

    const filters = {
      minFollowers,
      maxFollowers,
      minEngagement,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    }

    const result = await phyllo.searchPublicCreators(q, platform, filters)

    const creators =
      result?.data || (q ? generateMockSearchResults(q, platform, filters.limit, filters) : [])

    res.json({ success: true, data: creators })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Failed to search creators' })
  }
})

module.exports = router
