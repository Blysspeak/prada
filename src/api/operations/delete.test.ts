/**
 * Tests for api/operations/delete.ts
 */

import { vi } from 'vitest'
import { createDelete } from './delete.js'
import { mockSchema, createMockPrismaClient, createField } from '../../__tests__/fixtures.js'
import type { Schema } from '../../schema/types.js'

describe('createDelete', () => {
  it('should return a function', () => {
    const prisma = createMockPrismaClient()
    const del = createDelete({ prisma, schema: mockSchema })
    expect(typeof del).toBe('function')
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const del = createDelete({ prisma, schema: mockSchema })

    await expect(del('NonExistent', 1)).rejects.toThrow('Model "NonExistent" not found')
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
    prisma.noId = { delete: vi.fn() }

    const del = createDelete({ prisma, schema })

    await expect(del('NoId', 1)).rejects.toThrow('Model "NoId" has no id field')
  })

  it('should throw when delete action is not allowed', async () => {
    const prisma = createMockPrismaClient()
    const del = createDelete({
      prisma,
      schema: mockSchema,
      config: { actions: ['read'] }
    })

    await expect(del('User', 1)).rejects.toThrow('Delete not allowed for "User"')
  })

  it('should allow delete when actions include delete', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.delete.mockResolvedValue({ id: 1 })

    const del = createDelete({
      prisma,
      schema: mockSchema,
      config: { actions: ['read', 'delete'] }
    })

    await del('User', 1)
    expect(prisma.user.delete).toHaveBeenCalled()
  })

  it('should allow delete when no config (default all actions)', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.delete.mockResolvedValue({ id: 1 })

    const del = createDelete({ prisma, schema: mockSchema })
    await del('User', 1)

    expect(prisma.user.delete).toHaveBeenCalled()
  })

  it('should call prisma delete with correct where clause', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.delete.mockResolvedValue({ id: 1 })

    const del = createDelete({ prisma, schema: mockSchema })
    await del('User', 1)

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 1 }
    })
  })

  it('should parse string id to number', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.delete.mockResolvedValue({ id: 42 })

    const del = createDelete({ prisma, schema: mockSchema })
    await del('User', '42')

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 42 }
    })
  })

  it('should return the deleted record', async () => {
    const prisma = createMockPrismaClient()
    const deletedRecord = { id: 1, email: 'test@test.com' }
    prisma.user.delete.mockResolvedValue(deletedRecord)

    const del = createDelete({ prisma, schema: mockSchema })
    const result = await del('User', 1)

    expect(result).toEqual(deletedRecord)
  })

  describe('hooks', () => {
    it('should run global beforeDelete hook with id', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const beforeDelete = vi.fn()

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeDelete } }
      })

      await del('User', 1)

      expect(beforeDelete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific beforeDelete hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const beforeDelete = vi.fn()

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: { User: { beforeDelete } }
      })

      await del('User', 1)

      expect(beforeDelete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run global afterDelete hook with id', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const afterDelete = vi.fn()

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: { '*': { afterDelete } }
      })

      await del('User', 1)

      expect(afterDelete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run model-specific afterDelete hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const afterDelete = vi.fn()

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: { User: { afterDelete } }
      })

      await del('User', 1)

      expect(afterDelete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run hooks in correct order', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const order: string[] = []

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: {
          '*': {
            beforeDelete: vi.fn().mockImplementation(() => { order.push('global-before') }),
            afterDelete: vi.fn().mockImplementation(() => { order.push('global-after') })
          },
          User: {
            beforeDelete: vi.fn().mockImplementation(() => { order.push('model-before') }),
            afterDelete: vi.fn().mockImplementation(() => { order.push('model-after') })
          }
        }
      })

      await del('User', 1)

      expect(order).toEqual(['global-before', 'model-before', 'global-after', 'model-after'])
    })

    it('should pass hook context with prisma and schema', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.delete.mockResolvedValue({ id: 1 })

      const beforeDelete = vi.fn()

      const del = createDelete({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeDelete } }
      })

      await del('User', 1)

      expect(beforeDelete).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          model: 'User',
          schema: mockSchema,
          prisma
        })
      )
    })
  })
})
