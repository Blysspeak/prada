/**
 * API Module
 *
 * Exports API handler, routes, query builder, and sanitizer utilities.
 */

// Main exports
export { createApiHandler } from './handler.js'
export { createCrudRoutes } from './routes.js'

// Types
export type {
  PrismaClient,
  PaginationParams,
  SortParams,
  FilterParams,
  FindManyParams,
  PaginatedResponse,
  RecordResponse,
  CrudAction,
  FieldConfig,
  ModelConfig,
  ModelConfigs,
  CrudHookContext,
  BeforeCreateHook,
  AfterCreateHook,
  BeforeUpdateHook,
  AfterUpdateHook,
  BeforeDeleteHook,
  AfterDeleteHook,
  BeforeFindHook,
  AfterFindHook,
  ModelHooks,
  CrudHooks,
  ApiHandlerOptions,
  ApiHandler
} from './types.js'

// Operations (for advanced usage)
export {
  createFindMany,
  createFindOne,
  createCreate,
  createUpdate,
  createDelete
} from './operations/index.js'

// Query builder utilities
export {
  buildWhereClause,
  buildOrderByClause,
  buildIncludeClause,
  buildSelectClause,
  parsePagination
} from './query-builder.js'

// Sanitizer utilities
export {
  convertFieldValue,
  sanitizeInput,
  validateRequired,
  validateInput,
  parseId
} from './sanitizer.js'
