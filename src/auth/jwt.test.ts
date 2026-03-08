/**
 * Tests for auth/jwt.ts
 */

import jwt from 'jsonwebtoken'
import {
  generateToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired
} from './jwt.js'
import type { User } from './types.js'

const TEST_SECRET = 'test-jwt-secret-for-testing'

const testUser: User = {
  email: 'admin@example.com',
  role: 'admin'
}

const testUserWithLogin: User = {
  login: 'admin',
  role: 'admin'
}

describe('generateToken', () => {
  it('should generate a valid JWT token', () => {
    const token = generateToken(testUser, TEST_SECRET)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should encode email in the payload', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.email).toBe('admin@example.com')
  })

  it('should encode role in the payload', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.role).toBe('admin')
  })

  it('should use login when email is not provided', () => {
    const token = generateToken(testUserWithLogin, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.email).toBe('admin')
  })

  it('should set expiration time', () => {
    const token = generateToken(testUser, TEST_SECRET, '2h')
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.exp).toBeDefined()
    // Should expire roughly 2 hours from now
    const twoHoursInSeconds = 2 * 60 * 60
    expect(decoded.exp - decoded.iat).toBe(twoHoursInSeconds)
  })

  it('should default to 1h expiration', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    const oneHourInSeconds = 60 * 60
    expect(decoded.exp - decoded.iat).toBe(oneHourInSeconds)
  })

  it('should use default secret when not provided', () => {
    const token = generateToken(testUser)

    // Should decode with default secret
    const decoded = jwt.verify(token, 'prada-default-secret-change-in-production') as any
    expect(decoded.email).toBe('admin@example.com')
  })
})

describe('generateRefreshToken', () => {
  it('should generate a valid JWT token', () => {
    const token = generateRefreshToken(testUser, TEST_SECRET)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should include type: refresh in payload', () => {
    const token = generateRefreshToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.type).toBe('refresh')
  })

  it('should default to 7d expiration', () => {
    const token = generateRefreshToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    const sevenDaysInSeconds = 7 * 24 * 60 * 60
    expect(decoded.exp - decoded.iat).toBe(sevenDaysInSeconds)
  })

  it('should encode email in payload', () => {
    const token = generateRefreshToken(testUser, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.email).toBe('admin@example.com')
  })

  it('should use login when email not provided', () => {
    const token = generateRefreshToken(testUserWithLogin, TEST_SECRET)
    const decoded = jwt.verify(token, TEST_SECRET) as any

    expect(decoded.email).toBe('admin')
  })

  it('should accept custom expiration', () => {
    const token = generateRefreshToken(testUser, TEST_SECRET, '30d')
    const decoded = jwt.verify(token, TEST_SECRET) as any

    const thirtyDaysInSeconds = 30 * 24 * 60 * 60
    expect(decoded.exp - decoded.iat).toBe(thirtyDaysInSeconds)
  })
})

describe('generateTokens', () => {
  it('should return both accessToken and refreshToken', () => {
    const tokens = generateTokens(testUser, TEST_SECRET)

    expect(tokens).toHaveProperty('accessToken')
    expect(tokens).toHaveProperty('refreshToken')
    expect(typeof tokens.accessToken).toBe('string')
    expect(typeof tokens.refreshToken).toBe('string')
  })

  it('should generate different tokens for access and refresh', () => {
    const tokens = generateTokens(testUser, TEST_SECRET)
    expect(tokens.accessToken).not.toBe(tokens.refreshToken)
  })

  it('should respect custom expiration options', () => {
    const tokens = generateTokens(testUser, TEST_SECRET, {
      accessExpiresIn: '30m',
      refreshExpiresIn: '14d'
    })

    const accessDecoded = jwt.verify(tokens.accessToken, TEST_SECRET) as any
    const refreshDecoded = jwt.verify(tokens.refreshToken, TEST_SECRET) as any

    expect(accessDecoded.exp - accessDecoded.iat).toBe(30 * 60)
    expect(refreshDecoded.exp - refreshDecoded.iat).toBe(14 * 24 * 60 * 60)
  })

  it('should use defaults when no options provided', () => {
    const tokens = generateTokens(testUser, TEST_SECRET)

    const accessDecoded = jwt.verify(tokens.accessToken, TEST_SECRET) as any
    const refreshDecoded = jwt.verify(tokens.refreshToken, TEST_SECRET) as any

    expect(accessDecoded.exp - accessDecoded.iat).toBe(60 * 60)
    expect(refreshDecoded.exp - refreshDecoded.iat).toBe(7 * 24 * 60 * 60)
  })

  it('refresh token should have type=refresh', () => {
    const tokens = generateTokens(testUser, TEST_SECRET)

    const refreshDecoded = jwt.verify(tokens.refreshToken, TEST_SECRET) as any
    expect(refreshDecoded.type).toBe('refresh')
  })

  it('access token should not have type=refresh', () => {
    const tokens = generateTokens(testUser, TEST_SECRET)

    const accessDecoded = jwt.verify(tokens.accessToken, TEST_SECRET) as any
    expect(accessDecoded.type).toBeUndefined()
  })
})

describe('verifyToken', () => {
  it('should return decoded payload for valid token', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const payload = verifyToken(token, TEST_SECRET)

    expect(payload).toBeDefined()
    expect(payload!.email).toBe('admin@example.com')
    expect(payload!.role).toBe('admin')
  })

  it('should return null for invalid token', () => {
    const payload = verifyToken('invalid.token.here', TEST_SECRET)
    expect(payload).toBeNull()
  })

  it('should return null for token signed with different secret', () => {
    const token = generateToken(testUser, 'secret1')
    const payload = verifyToken(token, 'secret2')

    expect(payload).toBeNull()
  })

  it('should return null for expired token', () => {
    const token = jwt.sign(
      { email: 'admin@example.com', role: 'admin' },
      TEST_SECRET,
      { expiresIn: '0s' }
    )

    // Small delay to ensure expiration
    const payload = verifyToken(token, TEST_SECRET)
    expect(payload).toBeNull()
  })

  it('should return payload with iat and exp', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const payload = verifyToken(token, TEST_SECRET)

    expect(payload!.iat).toBeDefined()
    expect(payload!.exp).toBeDefined()
  })

  it('should return null for empty string token', () => {
    const payload = verifyToken('', TEST_SECRET)
    expect(payload).toBeNull()
  })
})

describe('decodeToken', () => {
  it('should decode token without verification', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const payload = decodeToken(token)

    expect(payload).toBeDefined()
    expect(payload!.email).toBe('admin@example.com')
    expect(payload!.role).toBe('admin')
  })

  it('should decode token even with wrong secret', () => {
    const token = generateToken(testUser, 'secret1')
    const payload = decodeToken(token)

    expect(payload).toBeDefined()
    expect(payload!.email).toBe('admin@example.com')
  })

  it('should return null for non-JWT string', () => {
    const payload = decodeToken('not-a-jwt')
    expect(payload).toBeNull()
  })

  it('should include exp in decoded payload', () => {
    const token = generateToken(testUser, TEST_SECRET)
    const payload = decodeToken(token)

    expect(payload!.exp).toBeDefined()
    expect(payload!.iat).toBeDefined()
  })
})

describe('isTokenExpired', () => {
  it('should return false for valid non-expired token', () => {
    const token = generateToken(testUser, TEST_SECRET, '1h')
    expect(isTokenExpired(token)).toBe(false)
  })

  it('should return true for expired token', () => {
    // Create a token that expired in the past
    const token = jwt.sign(
      { email: 'admin@example.com', role: 'admin', exp: Math.floor(Date.now() / 1000) - 100 },
      TEST_SECRET
    )

    expect(isTokenExpired(token)).toBe(true)
  })

  it('should return true for invalid token', () => {
    expect(isTokenExpired('invalid-token')).toBe(true)
  })

  it('should return true for token without exp', () => {
    const token = jwt.sign(
      { email: 'admin@example.com', role: 'admin' },
      TEST_SECRET,
      { noTimestamp: true }
    )

    // This token has no exp claim
    expect(isTokenExpired(token)).toBe(true)
  })

  it('should return false for token expiring far in the future', () => {
    const token = generateToken(testUser, TEST_SECRET, '365d')
    expect(isTokenExpired(token)).toBe(false)
  })
})
