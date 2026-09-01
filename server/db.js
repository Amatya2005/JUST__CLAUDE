const { Pool } = require('pg')
require('dotenv').config()

// Managed Postgres providers (Render, Railway, Heroku, Neon) terminate TLS with
// certificates that aren't in Node's trust store, so verification has to be
// relaxed there. Local Postgres runs without TLS at all. Set PGSSLMODE=disable
// to force plaintext, or PGSSLMODE=require against a provider with a real cert.
function sslConfig() {
  const mode = process.env.PGSSLMODE
  if (mode === 'disable') return false
  if (mode === 'require') return true
  if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false }
  return false
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err)
})

module.exports = pool
