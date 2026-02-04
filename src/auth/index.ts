/**
 * Auth Module
 *
 * Exports authentication utilities, services, and middleware.
 */

// Service
export {
  createAuthService,
  createAuthServiceFromConfig,
  validateCredentialsFromConfig
} from './service.js'

// Middleware
export {
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from './middleware.js'

// Routes
export { createAuthRoutes } from './routes.js'
export { createSetupRoutes } from './setup.js'

// Config
export {
  isConfigured,
  loadConfig,
  saveCredentials,
  deleteCredentials
} from './config.js'

// JWT utilities
export {
  generateToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired
} from './jwt.js'

// Password utilities
export {
  hashPassword,
  verifyPassword,
  comparePassword,
  hashPasswordBcrypt
} from './password.js'

// Types
export type {
  User,
  JwtPayload,
  AuthConfig,
  AuthTokens,
  AuthService,
  CredentialsConfig,
  LoadedConfig
} from './types.js'
