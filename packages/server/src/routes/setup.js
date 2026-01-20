import { Router } from 'express'
import { isConfigured, saveCredentials } from '@blysspeak/prada-core'

export function createSetupRoutes(cwd = process.cwd()) {
  const router = Router()

  // Check if setup is needed
  router.get('/status', (req, res) => {
    const configured = isConfigured(cwd)
    res.json({ configured })
  })

  // Setup credentials
  router.post('/init', (req, res) => {
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
