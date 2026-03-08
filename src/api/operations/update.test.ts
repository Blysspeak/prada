/**
 * Tests for api/operations/update.ts
 */

import { vi } from 'vitest'
import { createUpdate } from './update.js'
import { mockSchema, createMockPrismaClient, createField } from '../../__tests__/fixtures.js'
import type { Schema } from '../../schema/types.js'

describe('createUpdate', () => {
  it('should return a function', () => {
    const prisma = createMockPrismaClient()
    const update = createUpdate({ prisma, schema: mockSchema })
    expect(typeof update).toBe('function')
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const update = createUpdate({ prisma, schema: mockSchema })

    await expect(update('NonExistent', 1, {})).rejects.toThrow('Model "NonExistent" not found')
  })

  it('should throw for model with no id field', async () => {
    const schema: Schema = {
      models: [
        {
          name: 'NoId',
          fields: [createField({ name: 'name', type: 'string', isId: false })]
        }
      ],
      enums: []
    }
    const prisma = createMockPrismaClient() as any
    prisma.noId = { update: vi.fn() }

    const update = createUpdate({ prisma, schema })

    await expect(update('NoId', 1, {})).rejects.toThrow('Model "NoId" has no id field')
  })

  it('should throw when update action is not allowed', async () => {
    const prisma = createMockPrismaClient()
    const update = createUpdate({
      prisma,
      schema: mockSchema,
      config: { actions: ['read'] }
    })

    await expect(update('User', 1, { email: 'test@test.com' })).rejects.toThrow(
      'Update not allowed for "User"'
    )
  })

  it('should allow update when actions include update', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1 })

    const update = createUpdate({
      prisma,
      schema: mockSchema,
      config: { actions: ['read', 'update'] }
    })

    await update('User', 1, { email: 'test@test.com' })
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('should allow update when no config (default all actions)', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1 })

    const update = createUpdate({ prisma, schema: mockSchema })
    await update('User', 1, { email: 'test@test.com' })

    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('should call prisma update with correct where and data', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1, email: 'new@test.com' })

    const update = createUpdate({ prisma, schema: mockSchema })
    await update('User', 1, { email: 'new@test.com' })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ email: 'new@test.com' })
    })
  })

  it('should parse string id to number', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 42 })

    const update = createUpdate({ prisma, schema: mockSchema })
    await update('User', '42', { email: 'test@test.com' })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 }
      })
    )
  })

  it('should sanitize input data', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1 })

    const update = createUpdate({ prisma, schema: mockSchema })
    await update('User', 1, {
      email: 'test@test.com',
      unknownField: 'removed',
      posts: [] // relation, removed
    })

    const updateCall = prisma.user.update.mock.calls[0][0]
    expect(updateCall.data.email).toBe('test@test.com')
    expect(updateCall.data.unknownField).toBeUndefined()
    expect(updateCall.data.posts).toBeUndefined()
  })

  it('should exclude readonly fields', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.update.mockResolvedValue({ id: 1 })

    const update = createUpdate({
      prisma,
      schema: mockSchema,
      config: { fields: { createdAt: { readonly: true } } }
    })

    await update('User', 1, { email: 'test@test.com', createdAt: '2024-01-01' })

    const updateCall = prisma.user.update.mock.calls[0][0]
    expect(updateCall.data.createdAt).toBeUndefined()
  })

  it('should return the updated record', async () => {
    const prisma = createMockPrismaClient()
    const updatedRecord = { id: 1, email: 'updated@test.com' }
    prisma.user.update.mockResolvedValue(updatedRecord)

    const update = createUpdate({ prisma, schema: mockSchema })
    const result = await update('User', 1, { email: 'updated@test.com' })

    expect(result).toEqual(updatedRecord)
  })

  describe('hooks', () => {
    it('should run global beforeUpdate hook with id and data', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.update.mockResolvedValue({ id: 1 })

      const beforeUpdate = vi.fn().mockImplementation((_id, data) => data)

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeUpdate } }
      })

      await update('User', 1, { email: 'test@test.com' })

      expect(beforeUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ email: 'test@test.com' }),
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific beforeUpdate hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.update.mockResolvedValue({ id: 1 })

      const beforeUpdate = vi.fn().mockImplementation((_id, data) => data)

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: { User: { beforeUpdate } }
      })

      await update('User', 1, { email: 'test@test.com' })

      expect(beforeUpdate).toHaveBeenCalled()
    })

    it('should run global afterUpdate hook', async () => {
      const prisma = createMockPrismaClient()
      const record = { id: 1, email: 'test@test.com' }
      prisma.user.update.mockResolvedValue(record)

      const afterUpdate = vi.fn()

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { afterUpdate } }
      })

      await update('User', 1, { email: 'test@test.com' })

      expect(afterUpdate).toHaveBeenCalledWith(
        record,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific afterUpdate hook', async () => {
      const prisma = createMockPrismaClient()
      const record = { id: 1 }
      prisma.user.update.mockResolvedValue(record)

      const afterUpdate = vi.fn()

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: { User: { afterUpdate } }
      })

      await update('User', 1, { email: 'test@test.com' })

      expect(afterUpdate).toHaveBeenCalledWith(
        record,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should use modified data from beforeUpdate hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.update.mockResolvedValue({ id: 1 })

      const beforeUpdate = vi.fn().mockImplementation((_id, data) => ({
        ...data,
        email: 'modified@test.com'
      }))

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeUpdate } }
      })

      await update('User', 1, { email: 'original@test.com' })

      const updateCall = prisma.user.update.mock.calls[0][0]
      expect(updateCall.data.email).toBe('modified@test.com')
    })

    it('should run hooks in correct order', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.update.mockResolvedValue({ id: 1 })

      const order: string[] = []

      const update = createUpdate({
        prisma,
        schema: mockSchema,
        hooks: {
          '*': {
            beforeUpdate: vi.fn().mockImplementation((_id, d) => { order.push('global-before'); return d }),
            afterUpdate: vi.fn().mockImplementation(() => { order.push('global-after') })
          },
          User: {
            beforeUpdate: vi.fn().mockImplementation((_id, d) => { order.push('model-before'); return d }),
            afterUpdate: vi.fn().mockImplementation(() => { order.push('model-after') })
          }
        }
      })

      await update('User', 1, { email: 'test@test.com' })

      expect(order).toEqual(['global-before', 'model-before', 'global-after', 'model-after'])
    })
  })
})
