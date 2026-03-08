/**
 * Tests for api/operations/create.ts
 */

import { vi } from 'vitest'
import { createCreate } from './create.js'
import { mockSchema, createMockPrismaClient } from '../../__tests__/fixtures.js'

describe('createCreate', () => {
  it('should return a function', () => {
    const prisma = createMockPrismaClient()
    const create = createCreate({ prisma, schema: mockSchema })
    expect(typeof create).toBe('function')
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const create = createCreate({ prisma, schema: mockSchema })

    await expect(create('NonExistent', {})).rejects.toThrow('Model "NonExistent" not found')
  })

  it('should throw when create action is not allowed', async () => {
    const prisma = createMockPrismaClient()
    const create = createCreate({
      prisma,
      schema: mockSchema,
      config: { actions: ['read'] }
    })

    await expect(create('User', { email: 'test@test.com' })).rejects.toThrow(
      'Create not allowed for "User"'
    )
  })

  it('should allow create when actions include create', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1, email: 'test@test.com' })

    const create = createCreate({
      prisma,
      schema: mockSchema,
      config: { actions: ['create', 'read'] }
    })

    const result = await create('User', { email: 'test@test.com' })
    expect(result).toEqual({ id: 1, email: 'test@test.com' })
  })

  it('should allow create when no config (default all actions)', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1 })

    const create = createCreate({ prisma, schema: mockSchema })
    await create('User', { email: 'test@test.com' })

    expect(prisma.user.create).toHaveBeenCalled()
  })

  it('should sanitize input before creating', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1 })

    const create = createCreate({ prisma, schema: mockSchema })
    await create('User', {
      email: 'test@test.com',
      unknownField: 'should be removed',
      posts: [{ id: 1 }] // relation field, should be removed
    })

    const createCall = prisma.user.create.mock.calls[0][0]
    expect(createCall.data.email).toBe('test@test.com')
    expect(createCall.data.unknownField).toBeUndefined()
    expect(createCall.data.posts).toBeUndefined()
  })

  it('should convert field values during sanitization', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1 })

    const create = createCreate({ prisma, schema: mockSchema })
    await create('User', { email: 'test@test.com', isActive: 'true' })

    const createCall = prisma.user.create.mock.calls[0][0]
    expect(createCall.data.isActive).toBe(true)
  })

  it('should exclude readonly fields from config', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.create.mockResolvedValue({ id: 1 })

    const create = createCreate({
      prisma,
      schema: mockSchema,
      config: { fields: { createdAt: { readonly: true } } }
    })

    await create('User', { email: 'test@test.com', createdAt: '2024-01-01' })

    const createCall = prisma.user.create.mock.calls[0][0]
    expect(createCall.data.createdAt).toBeUndefined()
  })

  it('should return the created record', async () => {
    const prisma = createMockPrismaClient()
    const newRecord = { id: 1, email: 'test@test.com', name: 'Test' }
    prisma.user.create.mockResolvedValue(newRecord)

    const create = createCreate({ prisma, schema: mockSchema })
    const result = await create('User', { email: 'test@test.com', name: 'Test' })

    expect(result).toEqual(newRecord)
  })

  describe('hooks', () => {
    it('should run global beforeCreate hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.create.mockResolvedValue({ id: 1 })

      const beforeCreate = vi.fn().mockImplementation((data) => ({
        ...data,
        createdBy: 'system'
      }))

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeCreate } }
      })

      await create('User', { email: 'test@test.com' })

      expect(beforeCreate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@test.com' }),
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific beforeCreate hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.create.mockResolvedValue({ id: 1 })

      const beforeCreate = vi.fn().mockImplementation((data) => data)

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: { User: { beforeCreate } }
      })

      await create('User', { email: 'test@test.com' })

      expect(beforeCreate).toHaveBeenCalled()
    })

    it('should run global afterCreate hook', async () => {
      const prisma = createMockPrismaClient()
      const record = { id: 1, email: 'test@test.com' }
      prisma.user.create.mockResolvedValue(record)

      const afterCreate = vi.fn()

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { afterCreate } }
      })

      await create('User', { email: 'test@test.com' })

      expect(afterCreate).toHaveBeenCalledWith(
        record,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific afterCreate hook', async () => {
      const prisma = createMockPrismaClient()
      const record = { id: 1 }
      prisma.user.create.mockResolvedValue(record)

      const afterCreate = vi.fn()

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: { User: { afterCreate } }
      })

      await create('User', { email: 'test@test.com' })

      expect(afterCreate).toHaveBeenCalledWith(
        record,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run global hooks before model-specific hooks', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.create.mockResolvedValue({ id: 1 })

      const order: string[] = []

      const globalBefore = vi.fn().mockImplementation((d) => {
        order.push('global-before')
        return d
      })
      const modelBefore = vi.fn().mockImplementation((d) => {
        order.push('model-before')
        return d
      })
      const globalAfter = vi.fn().mockImplementation(() => {
        order.push('global-after')
      })
      const modelAfter = vi.fn().mockImplementation(() => {
        order.push('model-after')
      })

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: {
          '*': { beforeCreate: globalBefore, afterCreate: globalAfter },
          User: { beforeCreate: modelBefore, afterCreate: modelAfter }
        }
      })

      await create('User', { email: 'test@test.com' })

      expect(order).toEqual(['global-before', 'model-before', 'global-after', 'model-after'])
    })

    it('should use modified data from beforeCreate hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.create.mockResolvedValue({ id: 1 })

      const beforeCreate = vi.fn().mockImplementation((data) => ({
        ...data,
        email: 'modified@test.com'
      }))

      const create = createCreate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeCreate } }
      })

      await create('User', { email: 'original@test.com' })

      const createCall = prisma.user.create.mock.calls[0][0]
      expect(createCall.data.email).toBe('modified@test.com')
    })
  })
})
