import request from 'supertest'
import express from 'express'
import { createSetupRoutes } from './setup.js'
import { isConfigured, saveCredentials } from './config.js'

vi.mock('./config.js', () => ({
  isConfigured: vi.fn(),
  saveCredentials: vi.fn()
}))

const mockIsConfigured = isConfigured as ReturnType<typeof vi.fn>
const mockSaveCredentials = saveCredentials as ReturnType<typeof vi.fn>

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/', createSetupRoutes('/tmp/test-cwd'))
  return app
}

describe('createSetupRoutes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  describe('GET /status', () => {
    it('returns configured: true when configured', async () => {
      mockIsConfigured.mockReturnValue(true)

      const res = await request(app).get('/status')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ configured: true })
      expect(mockIsConfigured).toHaveBeenCalledWith('/tmp/test-cwd')
    })

    it('returns configured: false when not configured', async () => {
      mockIsConfigured.mockReturnValue(false)

      const res = await request(app).get('/status')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ configured: false })
    })
  })

  describe('POST /init', () => {
    it('saves credentials successfully', async () => {
      mockIsConfigured.mockReturnValue(false)

      const res = await request(app)
        .post('/init')
        .send({ login: 'admin', password: 'secret123' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, message: 'Credentials saved' })
      expect(mockSaveCredentials).toHaveBeenCalledWith('admin', 'secret123', '/tmp/test-cwd')
    })

    it('returns 400 if already configured', async () => {
      mockIsConfigured.mockReturnValue(true)

      const res = await request(app)
        .post('/init')
        .send({ login: 'admin', password: 'secret123' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Already configured')
      expect(mockSaveCredentials).not.toHaveBeenCalled()
    })

    it('returns 400 if missing login', async () => {
      mockIsConfigured.mockReturnValue(false)

      const res = await request(app)
        .post('/init')
        .send({ password: 'secret123' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Login and password are required')
    })

    it('returns 400 if missing password', async () => {
      mockIsConfigured.mockReturnValue(false)

      const res = await request(app)
        .post('/init')
        .send({ login: 'admin' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Login and password are required')
    })

    it('returns 400 if password too short', async () => {
      mockIsConfigured.mockReturnValue(false)

      const res = await request(app)
        .post('/init')
        .send({ login: 'admin', password: '12345' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Password must be at least 6 characters')
    })

    it('returns 500 if saveCredentials throws', async () => {
      mockIsConfigured.mockReturnValue(false)
      mockSaveCredentials.mockImplementation(() => {
        throw new Error('File write error')
      })

      const res = await request(app)
        .post('/init')
        .send({ login: 'admin', password: 'secret123' })

      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to save credentials')
    })
  })
})
