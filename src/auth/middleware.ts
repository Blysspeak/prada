/**
 * Auth Middleware
 *
 * Express middleware for JWT authentication.
 */

import type { Request, Response, NextFunction } from 'express'
import type { AuthService, JwtPayload } from './types.js'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

/**
 * Create authentication middleware
 *
 * @param authService - Auth service instance
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const auth = createAuthService({ login: 'admin', password: 'secret' })
 * const authMiddleware = createAuthMiddleware(auth)
 *
 * app.use('/api', authMiddleware, apiRoutes)
 * ```
 */
export function createAuthMiddleware(authService: AuthService) {
  return function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = (req as any).cookies?.prada_token

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : tokenFromCookie

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const payload = authService.verifyToken(token)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = payload
    next()
  }
}

/**
 * Create optional authentication middleware
 *
 * Sets req.user if valid token present, but doesn't require authentication.
 *
 * @param authService - Auth service instance
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * app.get('/api/public',
 *   createOptionalAuthMiddleware(auth),
 *   (req, res) => {
 *     if (req.user) {
 *       // Authenticated user
 *     } else {
 *       // Anonymous user
 *     }
 *   }
 * )
 * ```
 */
export function createOptionalAuthMiddleware(authService: AuthService) {
  return function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = (req as any).cookies?.prada_token

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : tokenFromCookie

    if (token) {
      const payload = authService.verifyToken(token)
      if (payload) {
        req.user = payload
      }
    }

    next()
  }
}
