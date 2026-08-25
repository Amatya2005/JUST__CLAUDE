require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const campaignRoutes = require('./routes/campaigns')
const influencerRoutes = require('./routes/influencers')
const analyticsRoutes = require('./routes/analytics')
const webhookRoutes = require('./routes/webhooks')
const discoveryRoutes = require('./routes/discovery')
const devRoutes = require('./routes/dev')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))

// Webhook route needs the raw body for signature verification, so it's
// mounted before the global JSON body parser.
app.use('/api/webhooks', express.raw({ type: '*/*' }), webhookRoutes)

app.use(express.json())

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }))

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/influencers', influencerRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/discovery', discoveryRoutes)

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes)
}

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`JustInfluence API listening on port ${PORT}`)
})
