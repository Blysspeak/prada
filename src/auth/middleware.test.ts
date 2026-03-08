/**
 * Tests for auth/middleware.ts
 */

import { vi } from 'vitest'
import { createAuthMiddleware, createOptionalAuthMiddleware } from './middleware.js'
import { createMockReq, createMockRes, createMockNext } from '../__tests__/fixtures.js'
import type { AuthService, JwtPayload } from './types.js'

function createMockAuthService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    validateCredentials: vi.fn(),
    generateTokens: vi.fn().mockReturnValue({ accessToken: 'at', refreshToken: 'rt' }),
    generateAccessToken: vi.fn().mockReturnValue('at'),
    verifyToken: vi.fn().mockReturnValue(null),
    ...overrides
  }
}

const validPayload: JwtPayload = {
  email: 'admin@example.com',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
}

describe('createAuthMiddleware', () => {
  it('should return a middleware function', () => {
    const authService = createMockAuthService()
    const middleware = createAuthMiddleware(authService)

    expect(typeof middleware).toBe('function')
  })

  it('should return 401 when no token provided', () => {
    const authService = createMockAuthService()
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq()
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should extract token from Authorization header', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('valid-token')
    expect(next).toHaveBeenCalled()
  })

  it('should extract token from cookie', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      cookies: { prada_token: 'cookie-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('cookie-token')
    expect(next).toHaveBeenCalled()
  })

  it('should prefer Authorization header over cookie', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer header-token' },
      cookies: { prada_token: 'cookie-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('header-token')
  })

  it('should return 401 for invalid token', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(null)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer invalid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should set req.user for valid token', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(req.user).toEqual(validPayload)
  })

  it('should call next() for valid token', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('should not extract token when Authorization header does not start with Bearer', () => {
    const authService = createMockAuthService()
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Basic some-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('should fall back to cookie when Authorization header is not Bearer', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Basic some-token' },
      cookies: { prada_token: 'cookie-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('cookie-token')
    expect(next).toHaveBeenCalled()
  })
})

describe('createOptionalAuthMiddleware', () => {
  it('should return a middleware function', () => {
    const authService = createMockAuthService()
    const middleware = createOptionalAuthMiddleware(authService)

    expect(typeof middleware).toBe('function')
  })

  it('should call next() even without token', () => {
    const authService = createMockAuthService()
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq()
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toBeUndefined()
  })

  it('should set req.user when valid token provided', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(req.user).toEqual(validPayload)
    expect(next).toHaveBeenCalled()
  })

  it('should call next() without setting user when token is invalid', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(null)
    })
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer invalid-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('should extract token from cookie', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq({
      cookies: { prada_token: 'cookie-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('cookie-token')
    expect(req.user).toEqual(validPayload)
  })

  it('should prefer Authorization header over cookie', () => {
    const authService = createMockAuthService({
      verifyToken: vi.fn().mockReturnValue(validPayload)
    })
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq({
      headers: { authorization: 'Bearer header-token' },
      cookies: { prada_token: 'cookie-token' }
    })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).toHaveBeenCalledWith('header-token')
  })

  it('should not call verifyToken when no token at all', () => {
    const authService = createMockAuthService()
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq()
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(authService.verifyToken).not.toHaveBeenCalled()
  })

  it('should not set req.user when no Authorization and no cookie', () => {
    const authService = createMockAuthService()
    const middleware = createOptionalAuthMiddleware(authService)

    const req = createMockReq({ headers: {}, cookies: {} })
    const res = createMockRes()
    const next = createMockNext()

    middleware(req, res, next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })
})
