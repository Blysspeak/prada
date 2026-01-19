import { Router } from 'express'
import { createAuthMiddleware } from '../middleware/auth.js'

export function createAuthRoutes(authService) {
  const router = Router()
  const authMiddleware = createAuthMiddleware(authService)

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      const user = await authService.validateCredentials(email, password)

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const tokens = authService.generateTokens(user)

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
        user: { email: user.email, role: user.role },
        accessToken: tokens.accessToken
      })
    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/logout', (req, res) => {
    res.clearCookie('prada_token')
    res.clearCookie('prada_refresh')
    return res.json({ success: true })
  })

  router.get('/me', authMiddleware, (req, res) => {
    return res.json({
      user: {
        email: req.user?.email,
        role: req.user?.role
      }
    })
  })

  router.post('/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies?.prada_refresh

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
