require('dotenv').config()
const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')

const { validateConfig } = require('./config')
const { runMigrations } = require('./scripts/migrate')
const authRoutes = require('./routes/auth')
const campaignRoutes = require('./routes/campaigns')
const influencerRoutes = require('./routes/influencers')
const analyticsRoutes = require('./routes/analytics')
const webhookRoutes = require('./routes/webhooks')
const discoveryRoutes = require('./routes/discovery')
const devRoutes = require('./routes/dev')

validateConfig()

const isProduction = process.env.NODE_ENV === 'production'
const app = express()

app.set('trust proxy', 1)

// In production the client is served from this same origin, so cross-origin
// requests aren't part of the normal flow. FRONTEND_URL stays configurable for
// split deployments and for local dev, where Vite runs on its own port.
if (process.env.FRONTEND_URL) {
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
}

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

if (!isProduction) {
  app.use('/api/dev', devRoutes)
}

// Unmatched API routes get JSON, never the SPA shell.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// Serve the built client, when it exists, so a single service hosts both the
// API and the frontend. Client-side routes (/dashboard, /join, …) have no file
// on disk, so anything unmatched falls through to index.html.
const clientDist = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' })
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000

async function start() {
  // schema.sql is idempotent, so applying it on boot keeps a fresh deploy's
  // database in sync without a separate release step.
  if (process.env.RUN_MIGRATIONS_ON_BOOT !== 'false') {
    try {
      await runMigrations({ closePool: false })
    } catch (err) {
      console.error('Migration failed on boot:', err.message)
      process.exit(1)
    }
  }

  app.listen(PORT, () => {
    console.log(`JustInfluence listening on port ${PORT}`)
  })
}

start()
