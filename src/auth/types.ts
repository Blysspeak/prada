/**
 * Auth Types
 */

/** User object returned after authentication */
export interface User {
  email?: string
  login?: string
  role: string
}

/** JWT payload structure */
export interface JwtPayload {
  email?: string
  login?: string
  role: string
  type?: 'refresh'
  iat?: number
  exp?: number
}

/** Auth service configuration */
export interface AuthConfig {
  /** Admin email/login */
  email?: string
  login?: string
  /** Plain text password (for simple setup) */
  password?: string
  /** Hashed password (for file-based config) */
  passwordHash?: string
  /** Salt for hashed password */
  salt?: string
  /** JWT secret (auto-generated if not provided) */
  jwtSecret?: string
  /** Access token expiration (default: '1h') */
  jwtExpiresIn?: string
  /** Refresh token expiration (default: '7d') */
  refreshExpiresIn?: string
  /** Disable authentication entirely */
  disabled?: boolean
}

/** Generated tokens */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/** Auth service interface */
export interface AuthService {
  /** Validate credentials and return user if valid */
  validateCredentials: (login: string, password: string) => Promise<User | null> | User | null | boolean
  /** Generate both access and refresh tokens */
  generateTokens: (user: User) => AuthTokens
  /** Generate access token only */
  generateAccessToken: (user: User) => string
  /** Verify and decode a token */
  verifyToken: (token: string) => JwtPayload | null
}

/** Credentials config from file */
export interface CredentialsConfig {
  login: string
  passwordHash: string
  salt: string
  secret: string
  createdAt: string
}

/** Loaded config structure */
export interface LoadedConfig {
  auth: {
    login?: string
    password?: string
    passwordHash?: string
    salt?: string
    secret?: string
    fromEnv?: boolean
    fromFile?: boolean
  } | null
}
