/**
 * Setup Routes
 *
 * Express router factory for initial setup endpoints.
 */

import { Router, type Request, type Response } from 'express'
import { isConfigured, saveCredentials } from './config.js'

/**
 * Create Express router with setup routes
 *
 * @param cwd - Working directory for config files (default: process.cwd())
 * @returns Express router with setup endpoints
 *
 * @example
 * ```typescript
 * app.use('/api/setup', createSetupRoutes())
 *
 * // Creates routes:
 * // GET  /api/setup/status - Check if setup is needed
 * // POST /api/setup/init   - Initialize credentials
 * ```
 */
export function createSetupRoutes(cwd: string = process.cwd()): Router {
  const router = Router()

  // Check if setup is needed
  router.get('/status', (_req: Request, res: Response) => {
    const configured = isConfigured(cwd)
    res.json({ configured })
  })

  // Setup credentials
  router.post('/init', (req: Request, res: Response) => {
    try {
      // Don't allow setup if already configured
      if (isConfigured(cwd)) {
        return res.status(400).json({ error: 'Already configured' })
      }

      const { login, password } = req.body

      if (!login || !password) {
        return res.status(400).json({ error: 'Login and password are required' })
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }

      saveCredentials(login, password, cwd)

      res.json({ success: true, message: 'Credentials saved' })
    } catch (error) {
      console.error('Setup error:', error)
      res.status(500).json({ error: 'Failed to save credentials' })
    }
  })

  return router
}
