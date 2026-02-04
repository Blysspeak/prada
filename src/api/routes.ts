/**
 * CRUD Routes
 *
 * Express router factory for CRUD endpoints.
 */

import { Router, type Request, type Response } from 'express'
import type { ApiHandler } from './types.js'

// Helper to safely get string from params
function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key]
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

/**
 * Create Express router with CRUD routes for all models
 *
 * @param apiHandler - API handler instance
 * @returns Express router with CRUD endpoints
 *
 * @example
 * ```typescript
 * const api = createApiHandler(prisma, schema)
 * app.use('/api', createCrudRoutes(api))
 *
 * // Creates routes:
 * // GET    /api/schema       - Get schema metadata
 * // GET    /api/:model       - List records
 * // GET    /api/:model/:id   - Get single record
 * // POST   /api/:model       - Create record
 * // PUT    /api/:model/:id   - Update record
 * // DELETE /api/:model/:id   - Delete record
 * ```
 */
export function createCrudRoutes(apiHandler: ApiHandler): Router {
  const router = Router()
  const schema = apiHandler.getSchema()

  // Get schema metadata
  router.get('/schema', (_req: Request, res: Response) => {
    return res.json(schema)
  })

  // List records
  router.get('/:model', async (req: Request, res: Response) => {
    try {
      const model = getParam(req.params, 'model')
      const {
        page,
        limit,
        sort,
        order,
        search,
        include,
        ...filters
      } = req.query

      const params = {
        page: page ? parseInt(String(page), 10) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
        sort: sort ? String(sort) : undefined,
        order: order as 'asc' | 'desc' | undefined,
        search: search ? String(search) : undefined,
        include: include ? String(include) : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      }

      const result = await apiHandler.findMany(model, params)
      return res.json(result)
    } catch (error) {
      const err = error as Error & { code?: string }
      console.error('Find many error:', err)
      return res.status(err.message?.includes('not found') ? 404 : 500).json({
        error: err.message || 'Internal server error'
      })
    }
  })

  // Get single record
  router.get('/:model/:id', async (req: Request, res: Response) => {
    try {
      const model = getParam(req.params, 'model')
      const id = getParam(req.params, 'id')
      const { include } = req.query

      const result = await apiHandler.findOne(model, id, include ? String(include) : undefined)

      if (!result) {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.json({ data: result })
    } catch (error) {
      const err = error as Error & { code?: string }
      console.error('Find one error:', err)
      return res.status(err.message?.includes('not found') ? 404 : 500).json({
        error: err.message || 'Internal server error'
      })
    }
  })

  // Create record
  router.post('/:model', async (req: Request, res: Response) => {
    try {
      const model = getParam(req.params, 'model')
      const data = req.body

      const result = await apiHandler.create(model, data)
      return res.status(201).json({ data: result })
    } catch (error) {
      const err = error as Error & { code?: string }
      console.error('Create error:', err)

      if (err.message?.includes('not allowed')) {
        return res.status(403).json({ error: err.message })
      }

      return res.status(500).json({
        error: err.message || 'Internal server error'
      })
    }
  })

  // Update record
  router.put('/:model/:id', async (req: Request, res: Response) => {
    try {
      const model = getParam(req.params, 'model')
      const id = getParam(req.params, 'id')
      const data = req.body

      const result = await apiHandler.update(model, id, data)
      return res.json({ data: result })
    } catch (error) {
      const err = error as Error & { code?: string }
      console.error('Update error:', err)

      if (err.message?.includes('not allowed')) {
        return res.status(403).json({ error: err.message })
      }

      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.status(500).json({
        error: err.message || 'Internal server error'
      })
    }
  })

  // Delete record
  router.delete('/:model/:id', async (req: Request, res: Response) => {
    try {
      const model = getParam(req.params, 'model')
      const id = getParam(req.params, 'id')

      await apiHandler.remove(model, id)
      return res.json({ success: true })
    } catch (error) {
      const err = error as Error & { code?: string }
      console.error('Delete error:', err)

      if (err.message?.includes('not allowed')) {
        return res.status(403).json({ error: err.message })
      }

      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.status(500).json({
        error: err.message || 'Internal server error'
      })
    }
  })

  return router
}
