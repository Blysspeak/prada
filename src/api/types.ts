/**
 * API Types
 *
 * Types for the API handler and CRUD operations.
 */

import type { Schema, Model, Field } from '../schema/types.js'

/** Prisma query arguments */
export interface PrismaQueryArgs {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
  include?: Record<string, boolean>
  select?: Record<string, boolean>
  data?: Record<string, unknown>
}

/** Prisma-like client interface (subset used by PRADA) */
export interface PrismaClient {
  [modelName: string]: {
    findMany: (args?: PrismaQueryArgs) => Promise<Record<string, unknown>[]>
    findUnique: (args: PrismaQueryArgs) => Promise<Record<string, unknown> | null>
    count: (args?: Pick<PrismaQueryArgs, 'where'>) => Promise<number>
    create: (args: Pick<PrismaQueryArgs, 'data'>) => Promise<Record<string, unknown>>
    update: (args: Pick<PrismaQueryArgs, 'where' | 'data'>) => Promise<Record<string, unknown>>
    delete: (args: Pick<PrismaQueryArgs, 'where'>) => Promise<Record<string, unknown>>
  }
}

/** Pagination parameters */
export interface PaginationParams {
  page?: number
  limit?: number
}

/** Sorting parameters */
export interface SortParams {
  sort?: string
  order?: 'asc' | 'desc'
}

/** Search and filter parameters */
export interface FilterParams {
  search?: string
  filters?: Record<string, unknown>
  include?: string
}

/** Combined query parameters for findMany */
export interface FindManyParams extends PaginationParams, SortParams, FilterParams {}

/** Paginated response */
export interface PaginatedResponse<T = unknown> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/** Single record response */
export interface RecordResponse<T = unknown> {
  data: T
}

/** CRUD action types */
export type CrudAction = 'create' | 'read' | 'update' | 'delete'

/** Field configuration for models */
export interface FieldConfig {
  /** Hide this field from responses */
  hidden?: boolean
  /** Make this field read-only (cannot be set via create/update) */
  readonly?: boolean
  /** Custom label for UI */
  label?: string
}

/** Model configuration */
export interface ModelConfig {
  /** Allowed CRUD actions (default: all) */
  actions?: CrudAction[]
  /** Default sort configuration */
  defaultSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  /** Field-specific configurations */
  fields?: Record<string, FieldConfig>
}

/** Model configurations map */
export interface ModelConfigs {
  [modelName: string]: ModelConfig
}

/** Hook function signatures */
export interface CrudHookContext {
  model: string
  schema: Schema
  prisma: PrismaClient
}

export type BeforeCreateHook = (
  data: Record<string, unknown>,
  context: CrudHookContext
) => Promise<Record<string, unknown>> | Record<string, unknown>

export type AfterCreateHook = (
  record: Record<string, unknown>,
  context: CrudHookContext
) => Promise<void> | void

export type BeforeUpdateHook = (
  id: string | number,
  data: Record<string, unknown>,
  context: CrudHookContext
) => Promise<Record<string, unknown>> | Record<string, unknown>

export type AfterUpdateHook = (
  record: Record<string, unknown>,
  context: CrudHookContext
) => Promise<void> | void

export type BeforeDeleteHook = (
  id: string | number,
  context: CrudHookContext
) => Promise<void> | void

export type AfterDeleteHook = (
  id: string | number,
  context: CrudHookContext
) => Promise<void> | void

export type BeforeFindHook = (
  query: FindManyParams,
  context: CrudHookContext
) => Promise<FindManyParams> | FindManyParams

export type AfterFindHook = (
  records: Record<string, unknown>[],
  context: CrudHookContext
) => Promise<Record<string, unknown>[]> | Record<string, unknown>[]

/** Model-specific hooks */
export interface ModelHooks {
  beforeCreate?: BeforeCreateHook
  afterCreate?: AfterCreateHook
  beforeUpdate?: BeforeUpdateHook
  afterUpdate?: AfterUpdateHook
  beforeDelete?: BeforeDeleteHook
  afterDelete?: AfterDeleteHook
  beforeFind?: BeforeFindHook
  afterFind?: AfterFindHook
}

/** Hooks configuration */
export interface CrudHooks {
  /** Global hooks (apply to all models) */
  '*'?: ModelHooks
  /** Per-model hooks */
  [modelName: string]: ModelHooks | undefined
}

/** API Handler options */
export interface ApiHandlerOptions {
  /** Model configurations */
  models?: ModelConfigs
  /** CRUD hooks */
  hooks?: CrudHooks
}

/** API Handler interface */
export interface ApiHandler {
  findMany: (modelName: string, params?: FindManyParams) => Promise<PaginatedResponse>
  findOne: (modelName: string, id: string | number, include?: string) => Promise<Record<string, unknown> | null>
  create: (modelName: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (modelName: string, id: string | number, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  remove: (modelName: string, id: string | number) => Promise<Record<string, unknown>>
  getSchema: () => Schema
}
