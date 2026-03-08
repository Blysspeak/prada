describe('api', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mockFetch)
    vi.stubEnv('BASE_URL', '')
    // Re-import to get fresh module with stubbed env
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  async function getApi() {
    const mod = await import('@/api')
    return mod.api
  }

  function mockResponse(data: unknown, ok = true, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: () => Promise.resolve(data)
    })
  }

  function mockErrorResponse(status: number, errorBody?: { error?: string }) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(errorBody ?? {})
    })
  }

  describe('auth', () => {
    it('login sends POST with email and password', async () => {
      const responseData = { user: { email: 'test@example.com' }, accessToken: 'tok123' }
      mockResponse(responseData)

      const api = await getApi()
      const result = await api.auth.login('test@example.com', 'password123')

      expect(result).toEqual(responseData)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      }))
    })

    it('logout sends POST', async () => {
      mockResponse(undefined)

      const api = await getApi()
      await api.auth.logout()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      }))
    })

    it('me sends GET', async () => {
      const responseData = { user: { email: 'test@example.com' } }
      mockResponse(responseData)

      const api = await getApi()
      const result = await api.auth.me()

      expect(result).toEqual(responseData)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        credentials: 'include'
      }))
    })

    it('refresh sends POST', async () => {
      const responseData = { accessToken: 'new-token' }
      mockResponse(responseData)

      const api = await getApi()
      const result = await api.auth.refresh()

      expect(result).toEqual(responseData)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
        method: 'POST'
      }))
    })
  })

  describe('schema', () => {
    it('get fetches /api/schema', async () => {
      const schema = { models: [], enums: [] }
      mockResponse(schema)

      const api = await getApi()
      const result = await api.schema.get()

      expect(result).toEqual(schema)
      expect(mockFetch).toHaveBeenCalledWith('/api/schema', expect.objectContaining({
        credentials: 'include'
      }))
    })
  })

  describe('model', () => {
    it('list fetches model records', async () => {
      const response = { data: [{ id: 1 }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }
      mockResponse(response)

      const api = await getApi()
      const result = await api.model.list('User')

      expect(result).toEqual(response)
      expect(mockFetch).toHaveBeenCalledWith('/api/User', expect.objectContaining({
        credentials: 'include'
      }))
    })

    it('list appends query params', async () => {
      mockResponse({ data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } })

      const api = await getApi()
      await api.model.list('User', { page: 2, limit: 10, sort: 'email', order: 'asc' })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('page=2')
      expect(calledUrl).toContain('limit=10')
      expect(calledUrl).toContain('sort=email')
      expect(calledUrl).toContain('order=asc')
    })

    it('list appends filter params', async () => {
      mockResponse({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })

      const api = await getApi()
      await api.model.list('User', { filters: { status: 'active', role: 'admin' } })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('status=active')
      expect(calledUrl).toContain('role=admin')
    })

    it('list skips empty/null/undefined filter values', async () => {
      mockResponse({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })

      const api = await getApi()
      await api.model.list('User', { filters: { status: '', role: null as unknown as string, name: undefined } })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toBe('/api/User')
    })

    it('get fetches single record by id', async () => {
      const response = { data: { id: 1, email: 'test@example.com' } }
      mockResponse(response)

      const api = await getApi()
      const result = await api.model.get('User', 1)

      expect(result).toEqual(response)
      expect(mockFetch).toHaveBeenCalledWith('/api/User/1', expect.objectContaining({
        credentials: 'include'
      }))
    })

    it('get appends include param', async () => {
      mockResponse({ data: { id: 1 } })

      const api = await getApi()
      await api.model.get('User', 1, 'posts')

      expect(mockFetch).toHaveBeenCalledWith('/api/User/1?include=posts', expect.anything())
    })

    it('create sends POST with body', async () => {
      const response = { data: { id: 1, email: 'new@example.com' } }
      mockResponse(response)

      const api = await getApi()
      const result = await api.model.create('User', { email: 'new@example.com' })

      expect(result).toEqual(response)
      expect(mockFetch).toHaveBeenCalledWith('/api/User', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com' })
      }))
    })

    it('update sends PUT with body', async () => {
      const response = { data: { id: 1, email: 'updated@example.com' } }
      mockResponse(response)

      const api = await getApi()
      const result = await api.model.update('User', 1, { email: 'updated@example.com' })

      expect(result).toEqual(response)
      expect(mockFetch).toHaveBeenCalledWith('/api/User/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ email: 'updated@example.com' })
      }))
    })

    it('delete sends DELETE request', async () => {
      mockResponse({ success: true })

      const api = await getApi()
      const result = await api.model.delete('User', 1)

      expect(result).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledWith('/api/User/1', expect.objectContaining({
        method: 'DELETE'
      }))
    })
  })

  describe('error handling', () => {
    it('throws error with message from response body', async () => {
      mockErrorResponse(400, { error: 'Invalid request' })

      const api = await getApi()
      await expect(api.auth.me()).rejects.toThrow('Invalid request')
    })

    it('throws generic HTTP error when response has no error message', async () => {
      mockErrorResponse(500, {})

      const api = await getApi()
      await expect(api.auth.me()).rejects.toThrow('HTTP error 500')
    })

    it('throws generic HTTP error when response body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json'))
      })

      const api = await getApi()
      await expect(api.auth.me()).rejects.toThrow('HTTP error 502')
    })
  })
})
