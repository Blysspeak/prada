/**
 * @blysspeak/prada
 *
 * PRADA - PRisma ADmin: A modular admin panel library for PostgreSQL databases.
 *
 * This library provides three levels of abstraction:
 *
 * ## Level 3: Ready-to-use solution
 * ```typescript
 * import { createPradaServer } from '@blysspeak/prada'
 *
 * app.use('/admin', await createPradaServer({
 *   prisma,
 *   auth: { login: 'admin', password: 'secret' }
 * }))
 * ```
 *
 * ## Level 2: Building blocks
 * ```typescript
 * import {
 *   parseSchema,
 *   createApiHandler,
 *   createAuthMiddleware,
 *   createCrudRoutes,
 *   createAuthRoutes
 * } from '@blysspeak/prada'
 *
 * const schema = await parseSchema()
 * const api = createApiHandler(prisma, schema, { hooks: {...} })
 * router.use('/api', createAuthMiddleware(auth), createCrudRoutes(api))
 * ```
 *
 * ## Level 1: Primitives
 * ```typescript
 * import {
 *   buildWhereClause,
 *   generateToken,
 *   getScalarFields
 * } from '@blysspeak/prada'
 *
 * const where = buildWhereClause(model, search, filters)
 * const token = generateToken(user, secret)
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// LEVEL 3: READY SOLUTION
// =============================================================================

export { createPradaServer, type PradaServerOptions } from './server.js'

// =============================================================================
// LEVEL 2: BUILDING BLOCKS
// =============================================================================

// --- Routes ---
export { createCrudRoutes } from './api/routes.js'
export { createAuthRoutes } from './auth/routes.js'
export { createSetupRoutes } from './auth/setup.js'

// --- Middleware ---
export { createAuthMiddleware, createOptionalAuthMiddleware } from './auth/middleware.js'

// --- Factories ---
export { createApiHandler } from './api/handler.js'
export { createAuthService, createAuthServiceFromConfig } from './auth/service.js'

// --- Schema ---
export { parseSchema, parseDMMF } from './schema/parser.js'

// --- Config ---
export { loadConfig, isConfigured, saveCredentials, deleteCredentials } from './auth/config.js'

// --- UI ---
export { resolveUIPath, serveUI, createSpaHandler, uiFilesExist } from './ui/serve.js'

// =============================================================================
// LEVEL 1: PRIMITIVES
// =============================================================================

// --- Schema utilities ---
export {
  getModelByName,
  getModels,
  getEnums,
  getScalarFields,
  getRelationFields,
  getIdField,
  getSearchableFields,
  getRequiredFields,
  getRelations
} from './schema/index.js'

// --- API operations (for custom implementations) ---
export {
  createFindMany,
  createFindOne,
  createCreate,
  createUpdate,
  createDelete
} from './api/operations/index.js'

// --- Query builder utilities ---
export {
  buildWhereClause,
  buildOrderByClause,
  buildIncludeClause,
  buildSelectClause,
  parsePagination
} from './api/query-builder.js'

// --- Sanitizer utilities ---
export {
  convertFieldValue,
  sanitizeInput,
  validateRequired,
  validateInput,
  parseId
} from './api/sanitizer.js'

// --- JWT utilities ---
export {
  generateToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired
} from './auth/jwt.js'

// --- Password utilities ---
export {
  hashPassword,
  verifyPassword,
  comparePassword,
  hashPasswordBcrypt
} from './auth/password.js'

// --- Credential validation ---
export { validateCredentialsFromConfig } from './auth/service.js'

// =============================================================================
// TYPES
// =============================================================================

// Re-export all types
export * from './types.js'
