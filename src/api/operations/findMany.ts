/**
 * FindMany Operation - List records with pagination, sorting, and filtering
 */

import type { Schema } from '../../schema/types.js'
import type {
  PrismaClient,
  FindManyParams,
  PaginatedResponse,
  ModelConfig,
  CrudHooks,
  CrudHookContext
} from '../types.js'
import {
  buildWhereClause,
  buildOrderByClause,
  buildIncludeClause,
  buildSelectClause,
  parsePagination
} from '../query-builder.js'
import { getModelClient } from '../sanitizer.js'

export interface FindManyOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createFindMany({ prisma, schema, config, hooks }: FindManyOptions) {
  return async (modelName: string, params: FindManyParams = {}): Promise<PaginatedResponse> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const client = getModelClient(prisma, modelName)
    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeFind hooks
    let p = { ...params }
    if (hooks?.['*']?.beforeFind) p = await hooks['*'].beforeFind(p, ctx)
    if (hooks?.[modelName]?.beforeFind) p = await hooks[modelName]!.beforeFind!(p, ctx)

    // Build query
    const { skip, take, page, limit } = parsePagination(p.page, p.limit)
    const orderBy = buildOrderByClause(p.sort, p.order, config?.defaultSort)
    const where = buildWhereClause(model, p.search, p.filters)
    const include = buildIncludeClause(model, p.include)
    const select = buildSelectClause(model, config?.fields)

    // Execute
    const [data, total] = await Promise.all([
      client.findMany({
        where, orderBy, skip, take,
        include: select ? undefined : include,
        select: select ? { ...select, ...(include || {}) } : undefined
      }),
      client.count({ where })
    ])

    // Run afterFind hooks
    let result = data
    if (hooks?.['*']?.afterFind) result = await hooks['*'].afterFind(result, ctx)
    if (hooks?.[modelName]?.afterFind) result = await hooks[modelName]!.afterFind!(result, ctx)

    return { data: result, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }
}
