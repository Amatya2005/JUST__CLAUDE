const INSECURE_SECRETS = ['your_jwt_secret_here', 'changeme', 'secret', 'test_secret']

// Fails fast at boot rather than letting a misconfigured production instance
// serve traffic with a guessable signing key or no database.
function validateConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  const errors = []

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set')
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    errors.push('JWT_SECRET is not set')
  } else if (isProduction) {
    if (INSECURE_SECRETS.includes(secret.toLowerCase())) {
      errors.push('JWT_SECRET is still a placeholder value')
    } else if (secret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production')
    }
  }

  if (errors.length > 0) {
    console.error('Invalid configuration:\n  - ' + errors.join('\n  - '))
    process.exit(1)
  }

  if (isProduction && !process.env.PHYLLO_WEBHOOK_SECRET) {
    console.warn(
      'PHYLLO_WEBHOOK_SECRET is not set — webhook signatures will not be verified. ' +
        'Set it before pointing Phyllo at this deployment.'
    )
  }
}

module.exports = { validateConfig }
