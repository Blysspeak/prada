/**
 * PRADA Server
 *
 * Main entry point for creating the PRADA admin server.
 * This is the "Level 3" ready-to-use solution.
 */

import { Router, static as expressStatic, json } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import { parseSchema } from './schema/index.js'
import { createApiHandler } from './api/handler.js'
import { createCrudRoutes } from './api/routes.js'
import {
  createAuthService,
  createAuthServiceFromConfig,
  createAuthMiddleware,
  createAuthRoutes,
  createSetupRoutes,
  loadConfig,
  isConfigured
} from './auth/index.js'
import { resolveUIPath } from './ui/serve.js'
import type { Schema } from './schema/types.js'
import type { ApiHandlerOptions, CrudHooks, ModelConfigs, PrismaClient } from './api/types.js'
import type { AuthConfig } from './auth/types.js'

/**
 * PRADA Server Options
 */
export interface PradaServerOptions {
  /** Prisma client instance */
  prisma: PrismaClient

  /** Path to Prisma schema file (optional, auto-detected) */
  schemaPath?: string

  /** Model configurations */
  models?: ModelConfigs

  /** CRUD hooks */
  hooks?: CrudHooks

  /** Auth configuration */
  auth?: {
    /** Admin login/email */
    login?: string
    /** Admin password */
    password?: string
    /** Disable authentication */
    disabled?: boolean
  }

  /** Custom path to UI static files */
  staticPath?: string

  /** Working directory for config files (default: process.cwd()) */
  cwd?: string
}

/**
 * Create PRADA admin server
 *
 * This is the "Level 3" API - a ready-to-use solution that handles everything:
 * - Schema parsing
 * - CRUD API endpoints
 * - Authentication
 * - UI serving
 *
 * @param options - Server options
 * @returns Express router with all PRADA functionality
 *
 * @example
 * ```typescript
 * import express from 'express'
 * import { PrismaClient } from '@prisma/client'
 * import { createPradaServer } from '@blysspeak/prada'
 *
 * const app = express()
 * const prisma = new PrismaClient()
 *
 * // Mount PRADA at /admin
 * app.use('/admin', await createPradaServer({
 *   prisma,
 *   auth: { login: 'admin', password: 'secret' }
 * }))
 *
 * // With hooks
 * app.use('/admin', await createPradaServer({
 *   prisma,
 *   auth: { login: 'admin', password: 'secret' },
 *   hooks: {
 *     'user.beforeCreate': async (data) => {
 *       data.createdAt = new Date()
 *       return data
 *     }
 *   }
 * }))
 * ```
 */
export async function createPradaServer(
  options: PradaServerOptions
): Promise<Router> {
  const router = Router()

  // Middleware
  router.use(cors({
    origin: true,
    credentials: true
  }))
  router.use(json())
  router.use(cookieParser())

  // Parse schema
  let schema: Schema
  try {
    schema = await parseSchema(options.schemaPath)
  } catch (error) {
    console.error('Failed to parse schema:', error)
    throw error
  }

  // Create API handler with hooks
  const apiHandlerOptions: ApiHandlerOptions = {
    models: options.models,
    hooks: options.hooks
  }
  const apiHandler = createApiHandler(options.prisma, schema, apiHandlerOptions)

  // Working directory for config files
  const cwd = options.cwd || process.cwd()

  // Create auth service once (singleton)
  let _authService: ReturnType<typeof createAuthService> | null = null
  const getAuthService = () => {
    if (!_authService) {
      _authService = options.auth
        ? createAuthService(options.auth)
        : createAuthServiceFromConfig(loadConfig(cwd))
    }
    return _authService
  }

  // Check if configured
  const isReady = () => options.auth || loadConfig(cwd).auth

  // Setup routes
  router.use('/api/setup', (req, res, next) => {
    if (options.auth) {
      return req.path === '/status'
        ? res.json({ configured: true })
        : res.status(400).json({ error: 'Setup not available' })
    }
    createSetupRoutes(cwd)(req, res, next)
  })

  // Auth routes
  router.use('/api/auth', (req, res, next) => {
    if (!isReady()) return res.status(503).json({ error: 'Not configured' })
    createAuthRoutes(getAuthService())(req, res, next)
  })

  // Protected API routes
  router.use('/api', (req, res, next) => {
    if (!isReady()) return res.status(503).json({ error: 'Not configured' })
    createAuthMiddleware(getAuthService())(req, res, () => {
      createCrudRoutes(apiHandler)(req, res, next)
    })
  })

  // Serve UI static files
  let staticPath = options.staticPath
  if (!staticPath) {
    staticPath = await resolveUIPath()
  }
  router.use(expressStatic(staticPath))

  // SPA fallback
  router.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.sendFile(resolve(staticPath!, 'index.html'))
  })

  return router
}

// Re-export for convenience
export { parseSchema } from './schema/index.js'
export { createApiHandler } from './api/handler.js'
export { createCrudRoutes } from './api/routes.js'
export {
  createAuthService,
  createAuthServiceFromConfig,
  createAuthMiddleware,
  createAuthRoutes,
  createSetupRoutes,
  loadConfig,
  isConfigured,
  saveCredentials
} from './auth/index.js'
export { resolveUIPath, serveUI, createSpaHandler } from './ui/serve.js'
