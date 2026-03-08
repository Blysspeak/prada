import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import { createAuthRoutes } from './routes.js'

vi.mock('./middleware.js', () => ({
  createAuthMiddleware: () => (req: any, _res: any, next: any) => {
    req.user = { email: 'admin', role: 'admin' }
    next()
  }
}))

const mockAuthService = {
  validateCredentials: vi.fn(),
  generateTokens: vi.fn().mockReturnValue({ accessToken: 'at', refreshToken: 'rt' }),
  generateAccessToken: vi.fn().mockReturnValue('new-at'),
  verifyToken: vi.fn(),
  getSecret: vi.fn().mockReturnValue('test-secret')
}

function createApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/', createAuthRoutes(mockAuthService as any))
  return app
}

describe('createAuthRoutes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthService.generateTokens.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' })
    mockAuthService.generateAccessToken.mockReturnValue('new-at')
    app = createApp()
  })

  describe('POST /login', () => {
    it('returns user and sets cookies with valid credentials', async () => {
      const user = { email: 'admin@test.com', role: 'admin' }
      mockAuthService.validateCredentials.mockResolvedValue(user)

      const res = await request(app)
        .post('/login')
        .send({ email: 'admin@test.com', password: 'secret' })

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual({ email: 'admin@test.com', role: 'admin' })
      expect(res.body.accessToken).toBe('at')
      expect(res.headers['set-cookie']).toBeDefined()
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('admin@test.com', 'secret')
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith(user)
    })

    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ password: 'secret' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Email and password are required')
    })

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'admin@test.com' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Email and password are required')
    })

    it('returns 401 with invalid credentials', async () => {
      mockAuthService.validateCredentials.mockResolvedValue(null)

      const res = await request(app)
        .post('/login')
        .send({ email: 'wrong@test.com', password: 'wrong' })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid credentials')
    })

    it('handles boolean true from validateCredentials (disabled auth)', async () => {
      mockAuthService.validateCredentials.mockResolvedValue(true)

      const res = await request(app)
        .post('/login')
        .send({ email: 'any', password: 'any' })

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual({ email: 'admin', role: 'admin' })
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith({ email: 'admin', role: 'admin' })
    })
  })

  describe('POST /logout', () => {
    it('clears cookies and returns success', async () => {
      const res = await request(app).post('/logout')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
      // Cookies are cleared via set-cookie headers with expires in the past
      const cookies = res.headers['set-cookie']
      expect(cookies).toBeDefined()
    })
  })

  describe('GET /me', () => {
    it('returns current user from auth middleware', async () => {
      const res = await request(app).get('/me')

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual({ email: 'admin', role: 'admin' })
    })
  })

  describe('POST /refresh', () => {
    it('returns new access token with valid refresh token', async () => {
      mockAuthService.verifyToken.mockReturnValue({ email: 'admin', role: 'admin' })

      const res = await request(app)
        .post('/refresh')
        .set('Cookie', 'prada_refresh=valid-refresh-token')

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBe('new-at')
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith({ email: 'admin', role: 'admin' })
    })

    it('returns 401 when no refresh cookie', async () => {
      const res = await request(app).post('/refresh')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No refresh token')
    })

    it('returns 401 and clears cookies when token is invalid', async () => {
      mockAuthService.verifyToken.mockReturnValue(null)

      const res = await request(app)
        .post('/refresh')
        .set('Cookie', 'prada_refresh=invalid-token')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid refresh token')
      const cookies = res.headers['set-cookie']
      expect(cookies).toBeDefined()
    })
  })
})
