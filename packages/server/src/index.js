import { Router, static as expressStatic, json } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  parseSchema,
  createApiHandler,
  loadConfig,
  isConfigured,
  validateCredentials
} from '@prada/core'
import { createAuthMiddleware, createAuthServiceFromConfig, createAuthServiceFromOptions } from './middleware/auth.js'
import { createAuthRoutes } from './routes/auth.js'
import { createCrudRoutes } from './routes/crud.js'
import { createSetupRoutes } from './routes/setup.js'

/**
 * @typedef {Object} PradaServerOptions
 * @property {import('@prisma/client').PrismaClient} prisma
 * @property {string} [schemaPath]
 * @property {Object} [models]
 * @property {Object} [auth] - Auth config: { login, password } or { disabled: true }
 * @property {string} [staticPath]
 * @property {string} [cwd] - Working directory for config files (default: process.cwd())
 */

/**
 * Create PRADA admin server
 * @param {PradaServerOptions} options
 * @returns {Promise<import('express').Router>}
 */
export async function createPradaServer(options) {
  const router = Router()

  router.use(cors({
    origin: true,
    credentials: true
  }))
  router.use(json())
  router.use(cookieParser())

  let schema

  try {
    schema = await parseSchema(options.schemaPath)
  } catch (error) {
    console.error('Failed to parse schema:', error)
    throw error
  }

  const apiHandler = createApiHandler(
    options.prisma,
    schema,
    options.models
  )

  // Working directory for config files
  const cwd = options.cwd || process.cwd()

  // Check if auth is provided directly in options (CLI mode)
  const getAuthConfig = () => {
    if (options.auth) {
      return options.auth
    }
    return loadConfig(cwd).auth
  }

  // Setup routes with cwd support
  router.use('/api/setup', (req, res, next) => {
    if (options.auth) {
      // CLI mode with auth provided - always configured
      if (req.path === '/status') {
        return res.json({ configured: true })
      }
      return res.status(400).json({ error: 'Setup not available in CLI mode' })
    }
    // Normal mode - use setup routes with cwd
    createSetupRoutes(cwd)(req, res, next)
  })

  // Dynamic auth middleware that reloads config
  router.use('/api/auth', (req, res, next) => {
    const authConfig = getAuthConfig()
    if (!authConfig) {
      return res.status(503).json({ error: 'Not configured. Please run setup.' })
    }
    const authService = options.auth
      ? createAuthServiceFromOptions(options.auth)
      : createAuthServiceFromConfig(loadConfig(cwd))
    const authRoutes = createAuthRoutes(authService)
    authRoutes(req, res, next)
  })

  // Protected API routes
  router.use('/api', (req, res, next) => {
    const authConfig = getAuthConfig()
    if (!authConfig) {
      return res.status(503).json({ error: 'Not configured' })
    }
    const authService = options.auth
      ? createAuthServiceFromOptions(options.auth)
      : createAuthServiceFromConfig(loadConfig(cwd))
    const authMiddleware = createAuthMiddleware(authService)
    authMiddleware(req, res, () => {
      createCrudRoutes(apiHandler)(req, res, next)
    })
  })

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const staticPath = options.staticPath || resolve(__dirname, '../../ui/dist')
  router.use(expressStatic(staticPath))

  router.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.sendFile(resolve(staticPath, 'index.html'))
  })

  return router
}

export { createAuthMiddleware } from './middleware/auth.js'
export { createAuthRoutes } from './routes/auth.js'
export { createCrudRoutes } from './routes/crud.js'
export { createSetupRoutes } from './routes/setup.js'
