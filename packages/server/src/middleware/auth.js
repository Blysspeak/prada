/**
 * Create auth middleware
 * @param {Object} authService - Auth service from @prada/core
 */
export function createAuthMiddleware(authService) {
  return function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = req.cookies?.prada_token

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

export function createOptionalAuthMiddleware(authService) {
  return function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    const tokenFromCookie = req.cookies?.prada_token

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
