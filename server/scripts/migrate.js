const fs = require('fs')
const path = require('path')
const pool = require('../db')

// schema.sql uses CREATE TABLE / INDEX IF NOT EXISTS throughout, so this is
// safe to run repeatedly — including on every boot.
async function runMigrations({ closePool = true } = {}) {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8')
  try {
    await pool.query(sql)
    console.log('Migration complete.')
  } finally {
    if (closePool) await pool.end()
  }
}

module.exports = { runMigrations }

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
