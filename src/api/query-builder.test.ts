/**
 * Tests for api/query-builder.ts
 */

import {
  buildWhereClause,
  buildOrderByClause,
  buildIncludeClause,
  buildSelectClause,
  parsePagination
} from './query-builder.js'
import { mockUserModel, mockPostModel, createField } from '../__tests__/fixtures.js'
import type { Model } from '../schema/types.js'

describe('buildWhereClause', () => {
  it('should return empty object with no search or filters', () => {
    expect(buildWhereClause(mockUserModel)).toEqual({})
  })

  it('should return empty object with undefined search and filters', () => {
    expect(buildWhereClause(mockUserModel, undefined, undefined)).toEqual({})
  })

  it('should build OR clause for search across string fields', () => {
    const result = buildWhereClause(mockUserModel, 'john')

    expect(result.OR).toBeDefined()
    expect(result.OR).toBeInstanceOf(Array)
    // User has email and name as string fields
    expect(result.OR).toEqual([
      { email: { contains: 'john', mode: 'insensitive' } },
      { name: { contains: 'john', mode: 'insensitive' } }
    ])
  })

  it('should not add OR clause when model has no searchable fields', () => {
    const model: Model = {
      name: 'Numeric',
      fields: [
        createField({ name: 'id', type: 'number' }),
        createField({ name: 'count', type: 'number', isId: false })
      ]
    }

    const result = buildWhereClause(model, 'test')
    expect(result.OR).toBeUndefined()
  })

  it('should add filter clauses', () => {
    const result = buildWhereClause(mockUserModel, undefined, { role: 'ADMIN', isActive: true })

    expect(result.role).toBe('ADMIN')
    expect(result.isActive).toBe(true)
  })

  it('should skip null, undefined, and empty string filter values', () => {
    const result = buildWhereClause(mockUserModel, undefined, {
      role: 'ADMIN',
      name: null,
      email: undefined,
      status: ''
    })

    expect(result.role).toBe('ADMIN')
    expect(result).not.toHaveProperty('name')
    expect(result).not.toHaveProperty('email')
    expect(result).not.toHaveProperty('status')
  })

  it('should combine search and filter clauses', () => {
    const result = buildWhereClause(mockUserModel, 'john', { role: 'ADMIN' })

    expect(result.OR).toBeDefined()
    expect(result.role).toBe('ADMIN')
  })

  it('should allow zero as a filter value', () => {
    const result = buildWhereClause(mockUserModel, undefined, { count: 0 })
    expect(result.count).toBe(0)
  })

  it('should allow false as a filter value', () => {
    const result = buildWhereClause(mockUserModel, undefined, { isActive: false })
    expect(result.isActive).toBe(false)
  })
})

describe('buildOrderByClause', () => {
  it('should return undefined with no sort parameters', () => {
    expect(buildOrderByClause()).toBeUndefined()
  })

  it('should build orderBy from sort field and order', () => {
    expect(buildOrderByClause('createdAt', 'desc')).toEqual({ createdAt: 'desc' })
  })

  it('should default to asc when order not provided', () => {
    expect(buildOrderByClause('name')).toEqual({ name: 'asc' })
  })

  it('should use defaultSort when no sort provided', () => {
    expect(buildOrderByClause(undefined, undefined, { field: 'createdAt', order: 'desc' })).toEqual({
      createdAt: 'desc'
    })
  })

  it('should prefer explicit sort over defaultSort', () => {
    const result = buildOrderByClause('name', 'asc', { field: 'createdAt', order: 'desc' })
    expect(result).toEqual({ name: 'asc' })
  })

  it('should return undefined when no sort and no defaultSort', () => {
    expect(buildOrderByClause(undefined, undefined, undefined)).toBeUndefined()
  })
})

describe('buildIncludeClause', () => {
  it('should return undefined when no includeParam', () => {
    expect(buildIncludeClause(mockUserModel)).toBeUndefined()
    expect(buildIncludeClause(mockUserModel, undefined)).toBeUndefined()
  })

  it('should return undefined for empty string', () => {
    expect(buildIncludeClause(mockUserModel, '')).toBeUndefined()
  })

  it('should include valid relation fields', () => {
    const result = buildIncludeClause(mockUserModel, 'posts')
    expect(result).toEqual({ posts: true })
  })

  it('should handle comma-separated includes', () => {
    // Post model has 'author' relation
    const result = buildIncludeClause(mockPostModel, 'author')
    expect(result).toEqual({ author: true })
  })

  it('should ignore non-relation fields', () => {
    const result = buildIncludeClause(mockUserModel, 'email,name')
    expect(result).toBeUndefined()
  })

  it('should ignore unknown fields', () => {
    const result = buildIncludeClause(mockUserModel, 'nonexistent')
    expect(result).toBeUndefined()
  })

  it('should trim whitespace around field names', () => {
    const result = buildIncludeClause(mockUserModel, ' posts ')
    expect(result).toEqual({ posts: true })
  })

  it('should include only valid relation fields from mixed input', () => {
    const result = buildIncludeClause(mockUserModel, 'posts,email,nonexistent')
    expect(result).toEqual({ posts: true })
  })
})

describe('buildSelectClause', () => {
  it('should return undefined when no fieldsConfig', () => {
    expect(buildSelectClause(mockUserModel)).toBeUndefined()
  })

  it('should return undefined when no hidden fields', () => {
    expect(buildSelectClause(mockUserModel, { email: { hidden: false } })).toBeUndefined()
  })

  it('should return undefined when empty config', () => {
    expect(buildSelectClause(mockUserModel, {})).toBeUndefined()
  })

  it('should exclude hidden fields', () => {
    const result = buildSelectClause(mockUserModel, { metadata: { hidden: true } })

    expect(result).toBeDefined()
    expect(result!.metadata).toBeUndefined()
    expect(result!.id).toBe(true)
    expect(result!.email).toBe(true)
    expect(result!.name).toBe(true)
  })

  it('should exclude multiple hidden fields', () => {
    const result = buildSelectClause(mockUserModel, {
      metadata: { hidden: true },
      updatedAt: { hidden: true }
    })

    expect(result).toBeDefined()
    expect(result!.metadata).toBeUndefined()
    expect(result!.updatedAt).toBeUndefined()
    expect(result!.id).toBe(true)
  })

  it('should include all non-hidden fields', () => {
    const result = buildSelectClause(mockUserModel, { metadata: { hidden: true } })

    const visibleFieldCount = mockUserModel.fields.length - 1 // minus metadata
    expect(Object.keys(result!)).toHaveLength(visibleFieldCount)
  })
})

describe('parsePagination', () => {
  it('should return defaults when no params', () => {
    const result = parsePagination()

    expect(result).toEqual({
      skip: 0,
      take: 20,
      page: 1,
      limit: 20
    })
  })

  it('should calculate skip from page and limit', () => {
    const result = parsePagination(2, 10)

    expect(result).toEqual({
      skip: 10,
      take: 10,
      page: 2,
      limit: 10
    })
  })

  it('should calculate skip for page 3', () => {
    const result = parsePagination(3, 25)

    expect(result).toEqual({
      skip: 50,
      take: 25,
      page: 3,
      limit: 25
    })
  })

  it('should cap limit at maxLimit', () => {
    const result = parsePagination(1, 500, 100)

    expect(result.take).toBe(100)
    expect(result.limit).toBe(100)
  })

  it('should use custom maxLimit', () => {
    const result = parsePagination(1, 200, 50)

    expect(result.take).toBe(50)
    expect(result.limit).toBe(50)
  })

  it('should default maxLimit to 100', () => {
    const result = parsePagination(1, 150)

    expect(result.take).toBe(100)
    expect(result.limit).toBe(100)
  })

  it('should handle page 1 with skip 0', () => {
    const result = parsePagination(1, 20)
    expect(result.skip).toBe(0)
  })

  it('should default page to 1 when undefined', () => {
    const result = parsePagination(undefined, 10)

    expect(result.page).toBe(1)
    expect(result.skip).toBe(0)
  })

  it('should default limit to 20 when undefined', () => {
    const result = parsePagination(2, undefined)

    expect(result.limit).toBe(20)
    expect(result.skip).toBe(20)
  })
})
