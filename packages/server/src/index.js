import { Router, static as expressStatic } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  parseSchema,
  createApiHandler,
  createAuthService
} from '@prada/core'
import { createAuthMiddleware } from './middleware/auth.js'
import { createAuthRoutes } from './routes/auth.js'
import { createCrudRoutes } from './routes/crud.js'

/**
 * @typedef {Object} PradaServerOptions
 * @property {import('@prisma/client').PrismaClient} prisma
 * @property {string} [schemaPath]
 * @property {Object} [models]
 * @property {Object} [auth]
 * @property {string} [auth.email]
 * @property {string} [auth.password]
 * @property {string} [auth.secret]
 * @property {string} [staticPath]
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

  if (options.auth) {
    const authService = createAuthService(options.auth)
    const authMiddleware = createAuthMiddleware(authService)

    router.use('/api/auth', createAuthRoutes(authService))

    router.use('/api', authMiddleware, createCrudRoutes(apiHandler))
  } else {
    router.use('/api', createCrudRoutes(apiHandler))
  }

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
