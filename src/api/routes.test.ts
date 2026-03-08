import request from 'supertest'
import express from 'express'
import { createCrudRoutes } from './routes.js'
import { mockSchema } from '../__tests__/fixtures.js'

const mockApiHandler = {
  getSchema: vi.fn().mockReturnValue(mockSchema),
  findMany: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn()
}

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/', createCrudRoutes(mockApiHandler as any))
  return app
}

describe('createCrudRoutes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiHandler.getSchema.mockReturnValue(mockSchema)
    app = createApp()
  })

  describe('GET /schema', () => {
    it('returns schema JSON', async () => {
      const res = await request(app).get('/schema')
      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockSchema)
    })
  })

  describe('GET /:model', () => {
    it('returns paginated data', async () => {
      const mockResult = { data: [{ id: 1 }], total: 1 }
      mockApiHandler.findMany.mockResolvedValue(mockResult)

      const res = await request(app).get('/User')
      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockResult)
      expect(mockApiHandler.findMany).toHaveBeenCalledWith('User', {
        page: undefined,
        limit: undefined,
        sort: undefined,
        order: undefined,
        search: undefined,
        include: undefined,
        filters: undefined
      })
    })

    it('passes query params correctly', async () => {
      mockApiHandler.findMany.mockResolvedValue({ data: [], total: 0 })

      await request(app)
        .get('/User')
        .query({ page: '2', limit: '10', sort: 'name', order: 'desc', search: 'test', include: 'posts' })

      expect(mockApiHandler.findMany).toHaveBeenCalledWith('User', {
        page: 2,
        limit: 10,
        sort: 'name',
        order: 'desc',
        search: 'test',
        include: 'posts',
        filters: undefined
      })
    })

    it('passes extra query params as filters', async () => {
      mockApiHandler.findMany.mockResolvedValue({ data: [], total: 0 })

      await request(app).get('/User').query({ role: 'admin' })

      expect(mockApiHandler.findMany).toHaveBeenCalledWith('User', expect.objectContaining({
        filters: { role: 'admin' }
      }))
    })

    it('returns 404 for "not found" error', async () => {
      mockApiHandler.findMany.mockRejectedValue(new Error('Model not found'))

      const res = await request(app).get('/Unknown')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Model not found' })
    })

    it('returns 500 for generic errors', async () => {
      mockApiHandler.findMany.mockRejectedValue(new Error('Database error'))

      const res = await request(app).get('/User')
      expect(res.status).toBe(500)
      expect(res.body).toEqual({ error: 'Database error' })
    })
  })

  describe('GET /:model/:id', () => {
    it('returns record', async () => {
      const record = { id: 1, email: 'test@test.com' }
      mockApiHandler.findOne.mockResolvedValue(record)

      const res = await request(app).get('/User/1')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ data: record })
    })

    it('returns 404 when record is null', async () => {
      mockApiHandler.findOne.mockResolvedValue(null)

      const res = await request(app).get('/User/999')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Record not found' })
    })

    it('passes include param', async () => {
      mockApiHandler.findOne.mockResolvedValue({ id: 1 })

      await request(app).get('/User/1').query({ include: 'posts' })
      expect(mockApiHandler.findOne).toHaveBeenCalledWith('User', '1', 'posts')
    })

    it('returns 404 for "not found" error', async () => {
      mockApiHandler.findOne.mockRejectedValue(new Error('Model not found'))

      const res = await request(app).get('/Unknown/1')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /:model', () => {
    it('creates record and returns 201', async () => {
      const newRecord = { id: 1, email: 'test@test.com' }
      mockApiHandler.create.mockResolvedValue(newRecord)

      const res = await request(app)
        .post('/User')
        .send({ email: 'test@test.com' })

      expect(res.status).toBe(201)
      expect(res.body).toEqual({ data: newRecord })
      expect(mockApiHandler.create).toHaveBeenCalledWith('User', { email: 'test@test.com' })
    })

    it('returns 403 for "not allowed" error', async () => {
      mockApiHandler.create.mockRejectedValue(new Error('Operation not allowed'))

      const res = await request(app).post('/User').send({ email: 'test@test.com' })
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ error: 'Operation not allowed' })
    })

    it('returns 500 for generic errors', async () => {
      mockApiHandler.create.mockRejectedValue(new Error('Database error'))

      const res = await request(app).post('/User').send({})
      expect(res.status).toBe(500)
    })
  })

  describe('PUT /:model/:id', () => {
    it('updates record', async () => {
      const updated = { id: 1, name: 'Updated' }
      mockApiHandler.update.mockResolvedValue(updated)

      const res = await request(app)
        .put('/User/1')
        .send({ name: 'Updated' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ data: updated })
      expect(mockApiHandler.update).toHaveBeenCalledWith('User', '1', { name: 'Updated' })
    })

    it('returns 404 for P2025 error code', async () => {
      const error = new Error('Record not found') as Error & { code: string }
      error.code = 'P2025'
      mockApiHandler.update.mockRejectedValue(error)

      const res = await request(app).put('/User/999').send({ name: 'X' })
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Record not found' })
    })

    it('returns 403 for "not allowed" error', async () => {
      mockApiHandler.update.mockRejectedValue(new Error('Operation not allowed'))

      const res = await request(app).put('/User/1').send({})
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /:model/:id', () => {
    it('deletes record', async () => {
      mockApiHandler.remove.mockResolvedValue({ id: 1 })

      const res = await request(app).delete('/User/1')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
    })

    it('returns 404 for P2025 error code', async () => {
      const error = new Error('Record not found') as Error & { code: string }
      error.code = 'P2025'
      mockApiHandler.remove.mockRejectedValue(error)

      const res = await request(app).delete('/User/999')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Record not found' })
    })

    it('returns 403 for "not allowed" error', async () => {
      mockApiHandler.remove.mockRejectedValue(new Error('Operation not allowed'))

      const res = await request(app).delete('/User/1')
      expect(res.status).toBe(403)
    })

    it('returns 500 for generic errors', async () => {
      mockApiHandler.remove.mockRejectedValue(new Error('Database error'))

      const res = await request(app).delete('/User/1')
      expect(res.status).toBe(500)
    })
  })
})
