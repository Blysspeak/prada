/**
 * Public TypeScript Types
 *
 * Re-exports all public types from the library.
 */

// Schema types
export type {
  FieldType,
  Field,
  Model,
  Enum,
  Schema,
  ModelMap
} from './schema/types.js'

// API types
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
} from './api/types.js'

// Auth types
export type {
  User,
  JwtPayload,
  AuthConfig,
  AuthTokens,
  AuthService,
  CredentialsConfig,
  LoadedConfig
} from './auth/types.js'

// Server types
export type { PradaServerOptions } from './server.js'
