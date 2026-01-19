import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const DEFAULT_JWT_SECRET = 'prada-default-secret-change-in-production'
const DEFAULT_JWT_EXPIRES = '1h'
const DEFAULT_REFRESH_EXPIRES = '7d'

/**
 * Create auth service
 * @param {{email: string, password: string, jwtSecret?: string, jwtExpiresIn?: string, refreshExpiresIn?: string}} config
 */
export function createAuthService(config) {
  const jwtSecret = config.jwtSecret || DEFAULT_JWT_SECRET
  const jwtExpiresIn = config.jwtExpiresIn || DEFAULT_JWT_EXPIRES
  const refreshExpiresIn = config.refreshExpiresIn || DEFAULT_REFRESH_EXPIRES

  let hashedPassword = null

  async function initPassword() {
    if (!hashedPassword) {
      hashedPassword = await bcrypt.hash(config.password, 10)
    }
  }

  async function validateCredentials(email, password) {
    await initPassword()

    if (email !== config.email) {
      return null
    }

    const isValid = await bcrypt.compare(password, hashedPassword)
    if (!isValid) {
      return null
    }

    return { email, role: 'admin' }
  }

  function generateAccessToken(user) {
    return jwt.sign(
      { email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    )
  }

  function generateRefreshToken(user) {
    return jwt.sign(
      { email: user.email, role: user.role, type: 'refresh' },
      jwtSecret,
      { expiresIn: refreshExpiresIn }
    )
  }

  function verifyToken(token) {
    try {
      return jwt.verify(token, jwtSecret)
    } catch {
      return null
    }
  }

  function generateTokens(user) {
    return {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    }
  }

  return {
    validateCredentials,
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyToken
  }
}
