import { resolve } from 'path'
import { existsSync } from 'fs'
import { resolveUIPath, serveUI, createSpaHandler, uiFilesExist } from './serve.js'
import { createMockReq, createMockRes } from '../__tests__/fixtures.js'

vi.mock('fs', () => ({
  existsSync: vi.fn()
}))

const mockExistsSync = existsSync as ReturnType<typeof vi.fn>

describe('resolveUIPath', () => {
  it('returns resolved custom path when provided', async () => {
    const result = await resolveUIPath('/custom/ui/path')
    expect(result).toBe(resolve('/custom/ui/path'))
  })

  it('falls back to workspace path when package resolution fails', async () => {
    // Without a custom path and without the npm package installed,
    // it should fall back to the workspace relative path
    const result = await resolveUIPath()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('serveUI', () => {
  it('creates a middleware function', () => {
    const middleware = serveUI('/tmp/fake-ui')
    expect(typeof middleware).toBe('function')
    // The returned function should accept 3 arguments (req, res, next)
    expect(middleware.length).toBe(3)
  })
})

describe('createSpaHandler', () => {
  it('returns a handler function', () => {
    const handler = createSpaHandler('/tmp/fake-ui')
    expect(typeof handler).toBe('function')
  })

  it('returns 404 JSON for /api paths', () => {
    const handler = createSpaHandler('/tmp/fake-ui')
    const req = createMockReq({ path: '/api/unknown' })
    const res = createMockRes()

    handler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' })
  })

  it('calls sendFile for non-api paths', () => {
    const handler = createSpaHandler('/tmp/fake-ui')
    const req = createMockReq({ path: '/dashboard' })
    const res = createMockRes()

    handler(req, res)

    expect(res.sendFile).toHaveBeenCalledWith(resolve('/tmp/fake-ui', 'index.html'))
  })

  it('calls sendFile for root path', () => {
    const handler = createSpaHandler('/tmp/fake-ui')
    const req = createMockReq({ path: '/' })
    const res = createMockRes()

    handler(req, res)

    expect(res.sendFile).toHaveBeenCalledWith(resolve('/tmp/fake-ui', 'index.html'))
  })
})

describe('uiFilesExist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when path and index.html exist', () => {
    mockExistsSync.mockReturnValue(true)

    const result = uiFilesExist('/tmp/ui')
    expect(result).toBe(true)
    expect(mockExistsSync).toHaveBeenCalledWith('/tmp/ui')
    expect(mockExistsSync).toHaveBeenCalledWith(resolve('/tmp/ui', 'index.html'))
  })

  it('returns false when path does not exist', () => {
    mockExistsSync.mockReturnValue(false)

    const result = uiFilesExist('/nonexistent')
    expect(result).toBe(false)
  })

  it('returns false when path exists but index.html does not', () => {
    mockExistsSync
      .mockReturnValueOnce(true)   // path exists
      .mockReturnValueOnce(false)  // index.html does not

    const result = uiFilesExist('/tmp/empty-ui')
    expect(result).toBe(false)
  })
})
