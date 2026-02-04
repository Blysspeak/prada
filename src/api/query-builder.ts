/**
 * Query Builder
 *
 * Utilities for building Prisma queries from request parameters.
 */

import type { Model, Field } from '../schema/types.js'
import { getSearchableFields } from '../schema/index.js'

/**
 * Build a Prisma where clause from search and filter parameters
 *
 * @example
 * ```typescript
 * const where = buildWhereClause(userModel, 'john', { role: 'admin' })
 * // { OR: [{ name: { contains: 'john', mode: 'insensitive' } }], role: 'admin' }
 * ```
 */
export function buildWhereClause(
  model: Model,
  search?: string,
  filters?: Record<string, unknown>
): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  // Add search clause
  if (search) {
    const searchFields = getSearchableFields(model)
    if (searchFields.length > 0) {
      where.OR = searchFields.map(field => ({
        [field.name]: { contains: search, mode: 'insensitive' }
      }))
    }
  }

  // Add filter clauses
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value
      }
    })
  }

  return where
}

/**
 * Build a Prisma orderBy clause from sort parameters
 *
 * @example
 * ```typescript
 * const orderBy = buildOrderByClause('createdAt', 'desc')
 * // { createdAt: 'desc' }
 * ```
 */
export function buildOrderByClause(
  sort?: string,
  order?: 'asc' | 'desc',
  defaultSort?: { field: string; order: 'asc' | 'desc' }
): Record<string, 'asc' | 'desc'> | undefined {
  if (sort) {
    return { [sort]: order || 'asc' }
  }

  if (defaultSort) {
    return { [defaultSort.field]: defaultSort.order }
  }

  return undefined
}

/**
 * Build a Prisma include clause from a comma-separated string
 *
 * @example
 * ```typescript
 * const include = buildIncludeClause(userModel, 'posts,comments')
 * // { posts: true, comments: true }
 * ```
 */
export function buildIncludeClause(
  model: Model,
  includeParam?: string
): Record<string, boolean> | undefined {
  if (!includeParam) return undefined

  const includes = includeParam.split(',').map(s => s.trim())
  const result: Record<string, boolean> = {}

  includes.forEach(fieldName => {
    const field = model.fields.find(f => f.name === fieldName)
    if (field && field.type === 'relation') {
      result[fieldName] = true
    }
  })

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Build a Prisma select clause based on hidden fields configuration
 *
 * @example
 * ```typescript
 * const select = buildSelectClause(userModel, { password: { hidden: true } })
 * // { id: true, email: true, name: true } // excludes password
 * ```
 */
export function buildSelectClause(
  model: Model,
  fieldsConfig?: Record<string, { hidden?: boolean }>
): Record<string, boolean> | undefined {
  const hiddenFields = fieldsConfig
    ? Object.entries(fieldsConfig)
        .filter(([_, cfg]) => cfg.hidden)
        .map(([name]) => name)
    : []

  if (hiddenFields.length === 0) return undefined

  const select: Record<string, boolean> = {}
  model.fields.forEach(field => {
    if (!hiddenFields.includes(field.name)) {
      select[field.name] = true
    }
  })

  return select
}

/**
 * Parse pagination parameters with defaults and limits
 *
 * @example
 * ```typescript
 * const { skip, take, page, limit } = parsePagination(2, 50)
 * // { skip: 50, take: 50, page: 2, limit: 50 }
 * ```
 */
export function parsePagination(
  page?: number,
  limit?: number,
  maxLimit: number = 100
): { skip: number; take: number; page: number; limit: number } {
  const actualPage = page || 1
  const actualLimit = Math.min(limit || 20, maxLimit)
  const skip = (actualPage - 1) * actualLimit

  return {
    skip,
    take: actualLimit,
    page: actualPage,
    limit: actualLimit
  }
}
