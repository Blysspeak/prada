/**
 * JWT Utilities
 *
 * Functions for generating and verifying JSON Web Tokens.
 */

import jwt, { type SignOptions } from 'jsonwebtoken'
import type { User, JwtPayload, AuthTokens } from './types.js'

const DEFAULT_JWT_SECRET = 'prada-default-secret-change-in-production'
const DEFAULT_JWT_EXPIRES = '1h'
const DEFAULT_REFRESH_EXPIRES = '7d'

/**
 * Generate an access token
 *
 * @param user - User object to encode
 * @param secret - JWT secret
 * @param expiresIn - Token expiration (default: '1h')
 * @returns Signed JWT token
 *
 * @example
 * ```typescript
 * const token = generateToken({ email: 'admin@example.com', role: 'admin' }, 'secret')
 * ```
 */
export function generateToken(
  user: User,
  secret: string = DEFAULT_JWT_SECRET,
  expiresIn: string = DEFAULT_JWT_EXPIRES
): string {
  return jwt.sign(
    { email: user.email || user.login, role: user.role },
    secret,
    { expiresIn } as SignOptions
  )
}

/**
 * Generate a refresh token
 *
 * @param user - User object to encode
 * @param secret - JWT secret
 * @param expiresIn - Token expiration (default: '7d')
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(
  user: User,
  secret: string = DEFAULT_JWT_SECRET,
  expiresIn: string = DEFAULT_REFRESH_EXPIRES
): string {
  return jwt.sign(
    { email: user.email || user.login, role: user.role, type: 'refresh' },
    secret,
    { expiresIn } as SignOptions
  )
}

/**
 * Generate both access and refresh tokens
 *
 * @param user - User object to encode
 * @param secret - JWT secret
 * @param options - Optional expiration overrides
 * @returns Object with accessToken and refreshToken
 *
 * @example
 * ```typescript
 * const { accessToken, refreshToken } = generateTokens(user, 'secret')
 * ```
 */
export function generateTokens(
  user: User,
  secret: string = DEFAULT_JWT_SECRET,
  options: { accessExpiresIn?: string; refreshExpiresIn?: string } = {}
): AuthTokens {
  return {
    accessToken: generateToken(user, secret, options.accessExpiresIn),
    refreshToken: generateRefreshToken(user, secret, options.refreshExpiresIn)
  }
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token to verify
 * @param secret - JWT secret
 * @returns Decoded payload or null if invalid
 *
 * @example
 * ```typescript
 * const payload = verifyToken(token, 'secret')
 * if (payload) {
 *   console.log(payload.email) // User email
 * }
 * ```
 */
export function verifyToken(
  token: string,
  secret: string = DEFAULT_JWT_SECRET
): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Decode a JWT token without verification
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 *
 * @example
 * ```typescript
 * const payload = decodeToken(token)
 * // Useful for checking expiration before refresh
 * ```
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Check if a token is expired
 *
 * @param token - JWT token to check
 * @returns True if expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000
}
