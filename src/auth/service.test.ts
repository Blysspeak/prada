/**
 * Tests for auth/service.ts
 */

import { vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { createAuthService, createAuthServiceFromConfig, validateCredentialsFromConfig } from './service.js'
import { hashPassword } from './password.js'
import type { LoadedConfig } from './types.js'

describe('createAuthService', () => {
  describe('disabled auth', () => {
    it('should allow all credentials when disabled', () => {
      const service = createAuthService({ disabled: true })

      const user = service.validateCredentials('anyone', 'anything')
      expect(user).toEqual({ email: 'admin', role: 'admin' })
    })

    it('should generate valid tokens when disabled', () => {
      const service = createAuthService({ disabled: true })

      const tokens = service.generateTokens({ email: 'admin', role: 'admin' })
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })

    it('should verify its own tokens when disabled', () => {
      const service = createAuthService({ disabled: true })

      const tokens = service.generateTokens({ email: 'admin', role: 'admin' })
      const payload = service.verifyToken(tokens.accessToken)
      expect(payload).toBeDefined()
      expect(payload!.email).toBe('admin')
    })

    it('should generate access token when disabled', () => {
      const service = createAuthService({ disabled: true })

      const token = service.generateAccessToken({ email: 'admin', role: 'admin' })
      expect(typeof token).toBe('string')
    })
  })

  describe('normal auth with login/password', () => {
    it('should validate correct credentials', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret'
      })

      const user = service.validateCredentials('admin', 'secret')
      expect(user).toEqual({ login: 'admin', role: 'admin' })
    })

    it('should reject incorrect password', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret'
      })

      const user = service.validateCredentials('admin', 'wrong')
      expect(user).toBeNull()
    })

    it('should reject incorrect login', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret'
      })

      const user = service.validateCredentials('unknown', 'secret')
      expect(user).toBeNull()
    })

    it('should use email as login when provided', () => {
      const service = createAuthService({
        email: 'admin@example.com',
        password: 'secret'
      })

      const user = service.validateCredentials('admin@example.com', 'secret')
      expect(user).toEqual({ login: 'admin@example.com', role: 'admin' })
    })

    it('should generate verifiable tokens', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret'
      })

      const tokens = service.generateTokens({ login: 'admin', role: 'admin' })
      const payload = service.verifyToken(tokens.accessToken)

      expect(payload).toBeDefined()
      expect(payload!.email).toBe('admin')
    })

    it('should use custom JWT secret', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret',
        jwtSecret: 'my-custom-secret'
      })

      const token = service.generateAccessToken({ login: 'admin', role: 'admin' })
      const decoded = jwt.verify(token, 'my-custom-secret') as any

      expect(decoded.email).toBe('admin')
    })

    it('should use custom expiration times', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret',
        jwtSecret: 'test-secret',
        jwtExpiresIn: '30m',
        refreshExpiresIn: '14d'
      })

      const tokens = service.generateTokens({ login: 'admin', role: 'admin' })

      const accessDecoded = jwt.verify(tokens.accessToken, 'test-secret') as any
      expect(accessDecoded.exp - accessDecoded.iat).toBe(30 * 60)

      const refreshDecoded = jwt.verify(tokens.refreshToken, 'test-secret') as any
      expect(refreshDecoded.exp - refreshDecoded.iat).toBe(14 * 24 * 60 * 60)
    })

    it('should not verify tokens with wrong secret', () => {
      const service = createAuthService({
        login: 'admin',
        password: 'secret',
        jwtSecret: 'correct-secret'
      })

      const wrongToken = jwt.sign({ email: 'admin', role: 'admin' }, 'wrong-secret')
      const payload = service.verifyToken(wrongToken)

      expect(payload).toBeNull()
    })
  })

  describe('auto-generated secret', () => {
    it('should generate a random secret when not provided', () => {
      const service1 = createAuthService({ login: 'admin', password: 'secret' })
      const service2 = createAuthService({ login: 'admin', password: 'secret' })

      const token1 = service1.generateAccessToken({ login: 'admin', role: 'admin' })

      // Token from service1 should not verify with service2's secret
      const payload = service2.verifyToken(token1)
      expect(payload).toBeNull()
    })
  })
})

describe('createAuthServiceFromConfig', () => {
  it('should create a service from loaded config', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    const service = createAuthServiceFromConfig(config)

    expect(service.validateCredentials).toBeDefined()
    expect(service.generateTokens).toBeDefined()
    expect(service.verifyToken).toBeDefined()
  })

  it('should validate env-based credentials', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    const service = createAuthServiceFromConfig(config)
    const user = service.validateCredentials('admin', 'secret')

    expect(user).toEqual({ login: 'admin', role: 'admin' })
  })

  it('should validate file-based credentials with hash', () => {
    const { hash, salt } = hashPassword('mypassword')
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        passwordHash: hash,
        salt,
        fromFile: true
      }
    }

    const service = createAuthServiceFromConfig(config)
    const user = service.validateCredentials('admin', 'mypassword')

    expect(user).toEqual({ login: 'admin', role: 'admin' })
  })

  it('should reject wrong password for file-based config', () => {
    const { hash, salt } = hashPassword('mypassword')
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        passwordHash: hash,
        salt,
        fromFile: true
      }
    }

    const service = createAuthServiceFromConfig(config)
    const user = service.validateCredentials('admin', 'wrongpassword')

    expect(user).toBeNull()
  })

  it('should use config secret for tokens', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        secret: 'custom-jwt-secret',
        fromEnv: true
      }
    }

    const service = createAuthServiceFromConfig(config)
    const token = service.generateAccessToken({ login: 'admin', role: 'admin' })

    const decoded = jwt.verify(token, 'custom-jwt-secret') as any
    expect(decoded.email).toBe('admin')
  })

  it('should use default secret when not in config', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    const service = createAuthServiceFromConfig(config)
    const token = service.generateAccessToken({ login: 'admin', role: 'admin' })

    // Default secret is 'prada-default-secret-change-me'
    const decoded = jwt.verify(token, 'prada-default-secret-change-me') as any
    expect(decoded.email).toBe('admin')
  })

  it('should return null when auth is null', () => {
    const config: LoadedConfig = { auth: null }

    const service = createAuthServiceFromConfig(config)
    const user = service.validateCredentials('admin', 'secret')

    expect(user).toBeNull()
  })
})

describe('validateCredentialsFromConfig', () => {
  it('should return null when auth config is null', () => {
    const config: LoadedConfig = { auth: null }
    expect(validateCredentialsFromConfig('admin', 'secret', config)).toBeNull()
  })

  it('should validate env-based credentials', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    expect(validateCredentialsFromConfig('admin', 'secret', config)).toEqual({
      login: 'admin',
      role: 'admin'
    })
  })

  it('should reject wrong env-based password', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    expect(validateCredentialsFromConfig('admin', 'wrong', config)).toBeNull()
  })

  it('should reject wrong env-based login', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret',
        fromEnv: true
      }
    }

    expect(validateCredentialsFromConfig('wrong', 'secret', config)).toBeNull()
  })

  it('should validate file-based credentials with hash', () => {
    const { hash, salt } = hashPassword('mypassword')
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        passwordHash: hash,
        salt,
        fromFile: true
      }
    }

    expect(validateCredentialsFromConfig('admin', 'mypassword', config)).toEqual({
      login: 'admin',
      role: 'admin'
    })
  })

  it('should reject wrong file-based password', () => {
    const { hash, salt } = hashPassword('mypassword')
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        passwordHash: hash,
        salt,
        fromFile: true
      }
    }

    expect(validateCredentialsFromConfig('admin', 'wrong', config)).toBeNull()
  })

  it('should reject wrong file-based login', () => {
    const { hash, salt } = hashPassword('mypassword')
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        passwordHash: hash,
        salt,
        fromFile: true
      }
    }

    expect(validateCredentialsFromConfig('wrong', 'mypassword', config)).toBeNull()
  })

  it('should return null when config has no fromEnv or fromFile', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        password: 'secret'
      }
    }

    expect(validateCredentialsFromConfig('admin', 'secret', config)).toBeNull()
  })

  it('should return null when file config missing hash or salt', () => {
    const config: LoadedConfig = {
      auth: {
        login: 'admin',
        fromFile: true
        // missing passwordHash and salt
      }
    }

    expect(validateCredentialsFromConfig('admin', 'secret', config)).toBeNull()
  })
})
