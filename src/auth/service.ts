/**
 * Auth Service
 *
 * Authentication service factory for various configurations.
 */

import { randomBytes } from 'crypto'
import type { User, AuthConfig, AuthService, LoadedConfig } from './types.js'
import { generateToken, generateRefreshToken, verifyToken } from './jwt.js'
import { verifyPassword } from './password.js'

const DEFAULT_SECRET = 'prada-default-secret-change-me'

/**
 * Create an auth service from simple options
 *
 * @param config - Auth configuration
 * @returns Auth service instance
 *
 * @example
 * ```typescript
 * // Simple username/password auth
 * const auth = createAuthService({
 *   login: 'admin',
 *   password: 'secret123'
 * })
 *
 * // Disable auth entirely
 * const auth = createAuthService({ disabled: true })
 * ```
 */
export function createAuthService(config: AuthConfig): AuthService {
  const secret = config.jwtSecret || randomBytes(32).toString('hex')
  const jwtExpiresIn = config.jwtExpiresIn || '1h'
  const refreshExpiresIn = config.refreshExpiresIn || '7d'

  // If auth is disabled, allow everything
  if (config.disabled) {
    return {
      validateCredentials: () => ({ email: 'admin', role: 'admin' }),
      generateTokens: (user) => ({
        accessToken: generateToken(user, secret, jwtExpiresIn),
        refreshToken: generateRefreshToken(user, secret, refreshExpiresIn)
      }),
      generateAccessToken: (user) => generateToken(user, secret, jwtExpiresIn),
      verifyToken: (token) => verifyToken(token, secret)
    }
  }

  // Normal auth with provided login/password
  const login = config.email || config.login
  const password = config.password

  return {
    validateCredentials: (inputLogin, inputPassword) => {
      if (inputLogin === login && inputPassword === password) {
        return { login: inputLogin, role: 'admin' }
      }
      return null
    },
    generateTokens: (user) => ({
      accessToken: generateToken(user, secret, jwtExpiresIn),
      refreshToken: generateRefreshToken(user, secret, refreshExpiresIn)
    }),
    generateAccessToken: (user) => generateToken(user, secret, jwtExpiresIn),
    verifyToken: (token) => verifyToken(token, secret)
  }
}

/**
 * Create an auth service from loaded config (supports env vars and file-based config)
 *
 * @param config - Loaded configuration
 * @returns Auth service instance
 *
 * @example
 * ```typescript
 * const config = loadConfig()
 * const auth = createAuthServiceFromConfig(config)
 * ```
 */
export function createAuthServiceFromConfig(config: LoadedConfig): AuthService {
  const secret = config.auth?.secret || DEFAULT_SECRET

  return {
    validateCredentials: (login, password) => {
      return validateCredentialsFromConfig(login, password, config)
    },
    generateTokens: (user) => ({
      accessToken: generateToken(user, secret, '1h'),
      refreshToken: generateRefreshToken(user, secret, '7d')
    }),
    generateAccessToken: (user) => generateToken(user, secret, '1h'),
    verifyToken: (token) => verifyToken(token, secret)
  }
}

/**
 * Validate credentials against loaded config
 *
 * @param login - Input login
 * @param password - Input password
 * @param config - Loaded config
 * @returns User object if valid, null otherwise
 */
export function validateCredentialsFromConfig(
  login: string,
  password: string,
  config: LoadedConfig
): User | null {
  if (!config.auth) return null

  // From .env - plain text comparison
  if (config.auth.fromEnv) {
    if (login === config.auth.login && password === config.auth.password) {
      return { login, role: 'admin' }
    }
    return null
  }

  // From file - hash comparison
  if (config.auth.fromFile && config.auth.passwordHash && config.auth.salt) {
    if (
      login === config.auth.login &&
      verifyPassword(password, config.auth.passwordHash, config.auth.salt)
    ) {
      return { login, role: 'admin' }
    }
    return null
  }

  return null
}
