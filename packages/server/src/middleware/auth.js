import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'crypto'
import { validateCredentials } from '@prada/core'

const DEFAULT_SECRET = 'prada-default-secret-change-me'

/**
 * Create auth service from direct options (CLI mode)
 * @param {Object} options - { login, password } or { disabled: true }
 */
export function createAuthServiceFromOptions(options) {
  // Generate a random secret for this session
  const secret = randomBytes(32).toString('hex')

  // If auth is disabled, allow everything
  if (options.disabled) {
    return {
      validateCredentials: () => true,
      generateTokens: (user) => ({
        accessToken: jwt.sign({ email: 'admin', role: 'admin' }, secret, { expiresIn: '24h' }),
        refreshToken: jwt.sign({ email: 'admin', role: 'admin', type: 'refresh' }, secret, { expiresIn: '7d' })
      }),
      generateAccessToken: () => jwt.sign({ email: 'admin', role: 'admin' }, secret, { expiresIn: '24h' }),
      verifyToken: (token) => {
        try {
          return jwt.verify(token, secret)
        } catch {
          return null
        }
      }
    }
  }

  // Normal auth with provided login/password
  return {
    validateCredentials: (login, password) => {
      return login === options.login && password === options.password
    },

    generateTokens: (user) => {
      const accessToken = jwt.sign(
        { email: user.login, role: 'admin' },
        secret,
        { expiresIn: '1h' }
      )
      const refreshToken = jwt.sign(
        { email: user.login, role: 'admin', type: 'refresh' },
        secret,
        { expiresIn: '7d' }
      )
      return { accessToken, refreshToken }
    },

    generateAccessToken: (user) => {
      return jwt.sign(
        { email: user.email || user.login, role: 'admin' },
        secret,
        { expiresIn: '1h' }
      )
    },

    verifyToken: (token) => {
      try {
        return jwt.verify(token, secret)
      } catch {
        return null
      }
    }
  }
}

/**
 * Create auth service from config
 */
export function createAuthServiceFromConfig(config) {
  const secret = config.auth?.secret || DEFAULT_SECRET

  return {
    validateCredentials: (login, password) => {
      return validateCredentials(login, password, config)
    },

    generateTokens: (user) => {
      const accessToken = jwt.sign(
        { email: user.login, role: user.role },
        secret,
        { expiresIn: '1h' }
      )
      const refreshToken = jwt.sign(
        { email: user.login, role: user.role, type: 'refresh' },
        secret,
        { expiresIn: '7d' }
      )
      return { accessToken, refreshToken }
    },

    generateAccessToken: (user) => {
      return jwt.sign(
        { email: user.email || user.login, role: user.role },
        secret,
        { expiresIn: '1h' }
      )
    },

    verifyToken: (token) => {
      try {
        return jwt.verify(token, secret)
      } catch {
        return null
      }
    }
  }
}

/**
 * Create auth middleware
 */
export function createAuthMiddleware(authService) {
  return function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = req.cookies?.prada_token

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : tokenFromCookie

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const payload = authService.verifyToken(token)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = payload
    next()
  }
}

export function createOptionalAuthMiddleware(authService) {
  return function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = req.cookies?.prada_token

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : tokenFromCookie

    if (token) {
      const payload = authService.verifyToken(token)
      if (payload) {
        req.user = payload
      }
    }

    next()
  }
}
