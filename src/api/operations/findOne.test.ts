/**
 * Tests for api/operations/findOne.ts
 */

import { vi } from 'vitest'
import { createFindOne } from './findOne.js'
import { mockSchema, createMockPrismaClient, createField } from '../../__tests__/fixtures.js'
import type { Schema, Model } from '../../schema/types.js'

describe('createFindOne', () => {
  it('should return a function', () => {
    const prisma = createMockPrismaClient()
    const findOne = createFindOne({ prisma, schema: mockSchema })
    expect(typeof findOne).toBe('function')
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const findOne = createFindOne({ prisma, schema: mockSchema })

    await expect(findOne('NonExistent', 1)).rejects.toThrow('Model "NonExistent" not found')
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
    prisma.noId = {
      findUnique: vi.fn()
    }

    const findOne = createFindOne({ prisma, schema })

    await expect(findOne('NoId', 1)).rejects.toThrow('Model "NoId" has no id field')
  })

  it('should call findUnique with correct where clause', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@test.com' })

    const findOne = createFindOne({ prisma, schema: mockSchema })
    await findOne('User', 1)

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 }
      })
    )
  })

  it('should parse string id to number for numeric id fields', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 42 })

    const findOne = createFindOne({ prisma, schema: mockSchema })
    await findOne('User', '42')

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 }
      })
    )
  })

  it('should return null when record not found', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue(null)

    const findOne = createFindOne({ prisma, schema: mockSchema })
    const result = await findOne('User', 999)

    expect(result).toBeNull()
  })

  it('should return the found record', async () => {
    const prisma = createMockPrismaClient()
    const record = { id: 1, email: 'test@test.com', name: 'Test' }
    prisma.user.findUnique.mockResolvedValue(record)

    const findOne = createFindOne({ prisma, schema: mockSchema })
    const result = await findOne('User', 1)

    expect(result).toEqual(record)
  })

  it('should pass include clause when provided', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1 })

    const findOne = createFindOne({ prisma, schema: mockSchema })
    await findOne('User', 1, 'posts')

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { posts: true }
      })
    )
  })

  it('should not pass include when not provided', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1 })

    const findOne = createFindOne({ prisma, schema: mockSchema })
    await findOne('User', 1)

    const call = prisma.user.findUnique.mock.calls[0][0]
    expect(call.include).toBeUndefined()
  })

  it('should use select clause when config has hidden fields', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1 })

    const findOne = createFindOne({
      prisma,
      schema: mockSchema,
      config: { fields: { metadata: { hidden: true } } }
    })
    await findOne('User', 1)

    const call = prisma.user.findUnique.mock.calls[0][0]
    expect(call.select).toBeDefined()
    expect(call.select.metadata).toBeUndefined()
    expect(call.include).toBeUndefined()
  })

  it('should merge select and include when both present', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findUnique.mockResolvedValue({ id: 1 })

    const findOne = createFindOne({
      prisma,
      schema: mockSchema,
      config: { fields: { metadata: { hidden: true } } }
    })
    await findOne('User', 1, 'posts')

    const call = prisma.user.findUnique.mock.calls[0][0]
    expect(call.select.posts).toBe(true)
    expect(call.include).toBeUndefined()
  })

  it('should work with Post model', async () => {
    const prisma = createMockPrismaClient()
    prisma.post.findUnique.mockResolvedValue({ id: 1, title: 'Test Post' })

    const findOne = createFindOne({ prisma, schema: mockSchema })
    const result = await findOne('Post', 1)

    expect(result).toEqual({ id: 1, title: 'Test Post' })
    expect(prisma.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 }
      })
    )
  })
})
