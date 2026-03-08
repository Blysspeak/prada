/**
 * Tests for api/handler.ts
 */

import { vi } from 'vitest'
import { createApiHandler } from './handler.js'
import { mockSchema, createMockPrismaClient } from '../__tests__/fixtures.js'

describe('createApiHandler', () => {
  it('should return an object with all CRUD methods', () => {
    const prisma = createMockPrismaClient()
    const api = createApiHandler(prisma, mockSchema)

    expect(api).toHaveProperty('findMany')
    expect(api).toHaveProperty('findOne')
    expect(api).toHaveProperty('create')
    expect(api).toHaveProperty('update')
    expect(api).toHaveProperty('remove')
    expect(api).toHaveProperty('getSchema')
  })

  it('should have functions for all methods', () => {
    const prisma = createMockPrismaClient()
    const api = createApiHandler(prisma, mockSchema)

    expect(typeof api.findMany).toBe('function')
    expect(typeof api.findOne).toBe('function')
    expect(typeof api.create).toBe('function')
    expect(typeof api.update).toBe('function')
    expect(typeof api.remove).toBe('function')
    expect(typeof api.getSchema).toBe('function')
  })

  it('getSchema should return the schema', () => {
    const prisma = createMockPrismaClient()
    const api = createApiHandler(prisma, mockSchema)

    expect(api.getSchema()).toBe(mockSchema)
  })

  it('findMany should delegate to createFindMany and return paginated result', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([{ id: 1, email: 'test@test.com' }])
    prisma.user.count.mockResolvedValue(1)

    const api = createApiHandler(prisma, mockSchema)
    const result = await api.findMany('User')

    expect(result.data).toEqual([{ id: 1, email: 'test@test.com' }])
    expect(result.meta).toHaveProperty('total', 1)
    expect(result.meta).toHaveProperty('page', 1)
  })

  it('findOne should delegate to createFindOne', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' })

    const api = createApiHandler(prisma, mockSchema)
    const result = await api.findOne('User', 1)

    expect(result).toEqual({ id: 1, email: 'test@test.com' })
  })

  it('create should delegate to createCreate', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1, email: 'new@test.com' })

    const api = createApiHandler(prisma, mockSchema)
    const result = await api.create('User', { email: 'new@test.com' })

    expect(result).toEqual({ id: 1, email: 'new@test.com' })
  })

  it('update should delegate to createUpdate', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1, email: 'updated@test.com' })

    const api = createApiHandler(prisma, mockSchema)
    const result = await api.update('User', 1, { email: 'updated@test.com' })

    expect(result).toEqual({ id: 1, email: 'updated@test.com' })
  })

  it('remove should delegate to createDelete', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.delete.mockResolvedValue({ id: 1 })

    const api = createApiHandler(prisma, mockSchema)
    const result = await api.remove('User', 1)

    expect(result).toEqual({ id: 1 })
  })

  it('should pass model config to operations', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const api = createApiHandler(prisma, mockSchema, {
      models: {
        User: {
          defaultSort: { field: 'createdAt', order: 'desc' }
        }
      }
    })

    await api.findMany('User')

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' }
      })
    )
  })

  it('should accept empty options', () => {
    const prisma = createMockPrismaClient()
    const api = createApiHandler(prisma, mockSchema, {})

    expect(api).toBeDefined()
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const api = createApiHandler(prisma, mockSchema)

    await expect(api.findMany('NonExistent')).rejects.toThrow('Model "NonExistent" not found')
  })
})
