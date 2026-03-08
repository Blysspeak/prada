/**
 * Tests for api/operations/findMany.ts
 */

import { vi } from 'vitest'
import { createFindMany } from './findMany.js'
import { mockSchema, createMockPrismaClient } from '../../__tests__/fixtures.js'

describe('createFindMany', () => {
  it('should return a function', () => {
    const prisma = createMockPrismaClient()
    const findMany = createFindMany({ prisma, schema: mockSchema })
    expect(typeof findMany).toBe('function')
  })

  it('should throw for non-existent model', async () => {
    const prisma = createMockPrismaClient()
    const findMany = createFindMany({ prisma, schema: mockSchema })

    await expect(findMany('NonExistent')).rejects.toThrow('Model "NonExistent" not found')
  })

  it('should return paginated response with defaults', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    prisma.user.count.mockResolvedValue(2)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    const result = await findMany('User')

    expect(result.data).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1
    })
  })

  it('should pass pagination params to prisma', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    await findMany('User', { page: 2, limit: 10 })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10
      })
    )
  })

  it('should pass sort params to prisma', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    await findMany('User', { sort: 'email', order: 'desc' })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { email: 'desc' }
      })
    )
  })

  it('should pass search to where clause', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    await findMany('User', { search: 'john' })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { contains: 'john', mode: 'insensitive' } }
          ])
        })
      })
    )
  })

  it('should pass filters to where clause', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    await findMany('User', { filters: { role: 'ADMIN' } })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'ADMIN' })
      })
    )
  })

  it('should pass include clause when provided', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    await findMany('User', { include: 'posts' })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { posts: true }
      })
    )
  })

  it('should use select clause when config has hidden fields', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({
      prisma,
      schema: mockSchema,
      config: { fields: { metadata: { hidden: true } } }
    })
    await findMany('User')

    const call = prisma.user.findMany.mock.calls[0][0]
    expect(call.select).toBeDefined()
    expect(call.select.metadata).toBeUndefined()
    expect(call.include).toBeUndefined()
  })

  it('should merge select and include when both present', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({
      prisma,
      schema: mockSchema,
      config: { fields: { metadata: { hidden: true } } }
    })
    await findMany('User', { include: 'posts' })

    const call = prisma.user.findMany.mock.calls[0][0]
    expect(call.select.posts).toBe(true)
    expect(call.include).toBeUndefined()
  })

  it('should calculate totalPages correctly', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(45)

    const findMany = createFindMany({ prisma, schema: mockSchema })
    const result = await findMany('User', { limit: 20 })

    expect(result.meta.totalPages).toBe(3)
  })

  it('should use defaultSort from config', async () => {
    const prisma = createMockPrismaClient()
    prisma.user.findMany.mockResolvedValue([])
    prisma.user.count.mockResolvedValue(0)

    const findMany = createFindMany({
      prisma,
      schema: mockSchema,
      config: { defaultSort: { field: 'createdAt', order: 'desc' } }
    })
    await findMany('User')

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' }
      })
    )
  })

  describe('hooks', () => {
    it('should run global beforeFind hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      const beforeFind = vi.fn().mockImplementation((params) => ({
        ...params,
        limit: 5
      }))

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeFind } }
      })

      await findMany('User', { limit: 20 })

      expect(beforeFind).toHaveBeenCalled()
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })

    it('should run model-specific beforeFind hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      const beforeFind = vi.fn().mockImplementation((params) => ({
        ...params,
        filters: { role: 'ADMIN' }
      }))

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: { User: { beforeFind } }
      })

      await findMany('User')

      expect(beforeFind).toHaveBeenCalled()
    })

    it('should run global afterFind hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([{ id: 1, secret: 'hidden' }])
      prisma.user.count.mockResolvedValue(1)

      const afterFind = vi.fn().mockImplementation((records) =>
        records.map((r: any) => {
          const { secret, ...rest } = r
          return rest
        })
      )

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: { '*': { afterFind } }
      })

      const result = await findMany('User')

      expect(afterFind).toHaveBeenCalled()
      expect(result.data[0]).toEqual({ id: 1 })
    })

    it('should run model-specific afterFind hook', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([{ id: 1 }])
      prisma.user.count.mockResolvedValue(1)

      const afterFind = vi.fn().mockImplementation((records) => records)

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: { User: { afterFind } }
      })

      await findMany('User')

      expect(afterFind).toHaveBeenCalledWith(
        [{ id: 1 }],
        expect.objectContaining({ model: 'User' })
      )
    })

    it('should run global hooks before model-specific hooks', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      const order: string[] = []

      const globalBeforeFind = vi.fn().mockImplementation((p) => {
        order.push('global')
        return p
      })
      const modelBeforeFind = vi.fn().mockImplementation((p) => {
        order.push('model')
        return p
      })

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: {
          '*': { beforeFind: globalBeforeFind },
          User: { beforeFind: modelBeforeFind }
        }
      })

      await findMany('User')

      expect(order).toEqual(['global', 'model'])
    })

    it('should pass hook context with model name, schema, and prisma', async () => {
      const prisma = createMockPrismaClient()
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      const beforeFind = vi.fn().mockImplementation((p) => p)

      const findMany = createFindMany({
        prisma,
        schema: mockSchema,
        hooks: { '*': { beforeFind } }
      })

      await findMany('User')

      expect(beforeFind).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          model: 'User',
          schema: mockSchema,
          prisma
        })
      )
    })
  })
})
