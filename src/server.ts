/**
 * PRADA Server
 *
 * Main entry point for creating the PRADA admin server.
 * This is the "Level 3" ready-to-use solution.
 */

import { Router, static as expressStatic, json } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { resolve } from 'path'

import { parseSchema } from './schema/index.js'
import { createApiHandler } from './api/handler.js'
import { createCrudRoutes } from './api/routes.js'
import {
  createAuthService,
  createAuthServiceFromConfig,
  createAuthMiddleware,
  createAuthRoutes,
  createSetupRoutes,
  loadConfig
} from './auth/index.js'
import { createAuditStore, createAuditHooks, createAuditRoutes } from './audit/index.js'
import { resolveUIPath } from './ui/serve.js'
import type { Schema } from './schema/types.js'
import type { ApiHandlerOptions, CrudHooks, ModelHooks, ModelConfigs, PrismaClient } from './api/types.js'
import type { AuditOptions } from './audit/types.js'
import type { RequestHandler } from 'express'

/**
 * Context object passed to modules.
 * Provides access to shared resources.
 */
export interface PradaContext {
  /** Prisma client instance */
  prisma: PrismaClient
  /** Parsed database schema */
  schema: Schema
  /** Express router to mount custom routes on */
  router: Router
  /** Auth middleware for protecting custom routes */
  authMiddleware: RequestHandler
  /** Configuration */
  config: {
    cwd: string
  }
}

/**
 * PRADA Module — extends the admin panel with custom functionality.
 *
 * @example
 * ```typescript
 * const giftsModule: PradaModule = {
 *   name: 'gifts',
 *   routes: (ctx) => {
 *     const router = Router()
 *     router.get('/gifts/stats', async (req, res) => {
 *       const count = await ctx.prisma.gift.count()
 *       res.json({ count })
 *     })
 *     ctx.router.use('/api', ctx.authMiddleware, router)
 *   }
 * }
 * ```
 */
export interface PradaModule {
  /** Module name (for logging and debugging) */
  name: string
  /** Register custom routes. Called after auth and CRUD routes are set up. */
  routes?: (ctx: PradaContext) => void | Promise<void>
  /** Middleware applied to all routes */
  middleware?: RequestHandler[]
}

/**
 * PRADA Server Options
 */
export interface PradaServerOptions {
  /** Prisma client instance */
  prisma: PrismaClient

  /** Path to Prisma schema file or directory of .prisma files */
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

  /** Extension modules */
  modules?: PradaModule[]

  /** Audit log configuration. Set to true for defaults, or pass options. */
  audit?: boolean | AuditOptions
}

/**
 * Create PRADA admin server
 *
 * This is the "Level 3" API - a ready-to-use solution that handles everything:
 * - Schema parsing (single file or directory)
 * - CRUD API endpoints
 * - Authentication
 * - Module system for extensions
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
 * // Basic usage
 * app.use('/admin', await createPradaServer({
 *   prisma,
 *   auth: { login: 'admin', password: 'secret' }
 * }))
 *
 * // With modules
 * app.use('/admin', await createPradaServer({
 *   prisma,
 *   schemaPath: './prisma/schema',  // directory of .prisma files
 *   modules: [giftsModule, statsModule],
 *   hooks: {
 *     '*': { beforeCreate: async (data) => ({ ...data, createdAt: new Date() }) }
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

  // Apply global module middleware
  if (options.modules) {
    for (const mod of options.modules) {
      if (mod.middleware) {
        for (const mw of mod.middleware) {
          router.use(mw)
        }
      }
    }
  }

  // Parse schema
  let schema: Schema
  try {
    schema = await parseSchema(options.schemaPath)
  } catch (error) {
    console.error('Failed to parse schema:', error)
    throw error
  }

  // Setup audit logging
  const auditConfig = options.audit
  const auditEnabled = auditConfig === true || (typeof auditConfig === 'object' && auditConfig.enabled !== false)
  const auditStore = auditEnabled
    ? createAuditStore(typeof auditConfig === 'object' ? { maxEntries: auditConfig.maxEntries } : undefined)
    : null

  // Merge user hooks with audit hooks
  let mergedHooks: CrudHooks | undefined = options.hooks
  if (auditStore) {
    const auditHooks = createAuditHooks(auditStore)
    mergedHooks = mergeHooks(options.hooks, auditHooks)
  }

  // Create API handler with hooks
  const apiHandlerOptions: ApiHandlerOptions = {
    models: options.models,
    hooks: mergedHooks
  }
  const apiHandler = createApiHandler(options.prisma, schema, apiHandlerOptions)

  // Working directory for config files
  const cwd = options.cwd || process.cwd()

  // Get auth service (cached for performance)
  const getAuthService = () => options.auth
    ? createAuthService(options.auth)
    : createAuthServiceFromConfig(loadConfig(cwd))

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

  // Auth middleware for protecting routes
  const authMiddleware: RequestHandler = (req, res, next) => {
    if (!isReady()) return res.status(503).json({ error: 'Not configured' })
    createAuthMiddleware(getAuthService())(req, res, next)
  }

  // Audit log routes (protected)
  if (auditStore) {
    router.use('/api/audit', authMiddleware, createAuditRoutes(auditStore))
  }

  // Protected API routes (CRUD)
  router.use('/api', authMiddleware, (req, res, next) => {
    createCrudRoutes(apiHandler)(req, res, next)
  })

  // Initialize modules
  if (options.modules) {
    const ctx: PradaContext = {
      prisma: options.prisma,
      schema,
      router,
      authMiddleware,
      config: { cwd }
    }

    for (const mod of options.modules) {
      if (mod.routes) {
        await mod.routes(ctx)
      }
    }
  }

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

/**
 * Merge two CrudHooks objects so that both sets of hooks run.
 * User hooks run first, then audit hooks run after.
 */
function mergeHooks(userHooks: CrudHooks | undefined, auditHooks: CrudHooks): CrudHooks {
  if (!userHooks) return auditHooks

  const merged: CrudHooks = { ...userHooks }

  for (const key of Object.keys(auditHooks)) {
    const auditModelHooks = auditHooks[key]
    if (!auditModelHooks) continue

    if (!merged[key]) {
      merged[key] = auditModelHooks
    } else {
      const userModelHooks = merged[key]!
      const combinedHooks: ModelHooks = { ...userModelHooks }

      for (const hookName of Object.keys(auditModelHooks) as (keyof ModelHooks)[]) {
        const auditHook = auditModelHooks[hookName]
        const userHook = userModelHooks[hookName]

        if (!auditHook) continue
        if (!userHook) {
          ;(combinedHooks as Record<string, unknown>)[hookName] = auditHook
        } else {
          // Chain: user hook first, then audit hook
          ;(combinedHooks as Record<string, unknown>)[hookName] = async (...args: unknown[]) => {
            const userResult = await (userHook as (...a: unknown[]) => unknown)(...args)
            // For before* hooks that return data, pass the result forward
            if (userResult !== undefined && hookName.startsWith('before')) {
              args[hookName === 'beforeUpdate' ? 1 : 0] = userResult
            }
            return (auditHook as (...a: unknown[]) => unknown)(...args)
          }
        }
      }

      merged[key] = combinedHooks
    }
  }

  return merged
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
