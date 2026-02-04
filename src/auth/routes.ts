/**
 * Auth Routes
 *
 * Express router factory for authentication endpoints.
 */

import { Router, type Request, type Response } from 'express'
import type { AuthService } from './types.js'
import { createAuthMiddleware } from './middleware.js'

/**
 * Create Express router with authentication routes
 *
 * @param authService - Auth service instance
 * @returns Express router with auth endpoints
 *
 * @example
 * ```typescript
 * const auth = createAuthService({ login: 'admin', password: 'secret' })
 * app.use('/api/auth', createAuthRoutes(auth))
 *
 * // Creates routes:
 * // POST /api/auth/login   - Login and get tokens
 * // POST /api/auth/logout  - Logout and clear cookies
 * // GET  /api/auth/me      - Get current user (requires auth)
 * // POST /api/auth/refresh - Refresh access token
 * ```
 */
export function createAuthRoutes(authService: AuthService): Router {
  const router = Router()
  const authMiddleware = createAuthMiddleware(authService)

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      const user = await authService.validateCredentials(email, password)

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Handle case where validateCredentials returns true (disabled auth) or User object
      const userObj = typeof user === 'boolean'
        ? { email: 'admin', role: 'admin' }
        : user
      const tokens = authService.generateTokens(userObj)

      res.cookie('prada_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
      })

      res.cookie('prada_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      return res.json({
        user: { email: userObj.email || userObj.login, role: userObj.role },
        accessToken: tokens.accessToken
      })
    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Logout
  router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('prada_token')
    res.clearCookie('prada_refresh')
    return res.json({ success: true })
  })

  // Get current user
  router.get('/me', authMiddleware, (req: Request, res: Response) => {
    return res.json({
      user: {
        email: req.user?.email,
        role: req.user?.role
      }
    })
  })

  // Refresh token
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = (req as any).cookies?.prada_refresh

      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' })
      }

      const payload = authService.verifyToken(refreshToken)

      if (!payload) {
        res.clearCookie('prada_token')
        res.clearCookie('prada_refresh')
        return res.status(401).json({ error: 'Invalid refresh token' })
      }

      const user = { email: payload.email, role: payload.role }
      const newAccessToken = authService.generateAccessToken(user)

      res.cookie('prada_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
      })

      return res.json({ accessToken: newAccessToken })
    } catch (error) {
      console.error('Refresh error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
