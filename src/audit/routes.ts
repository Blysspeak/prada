/**
 * Audit Routes
 *
 * Express router for audit log endpoints.
 */

import { Router, type Request, type Response } from 'express'
import type { AuditStore } from './types.js'

/**
 * Create Express router for audit log endpoints.
 *
 * @param store - The audit store instance
 * @returns Express router
 *
 * Routes:
 * - GET /          — List all entries with ?limit=50&offset=0&model=User&action=update
 * - GET /:model    — Per-model entries
 * - GET /:model/:id — Per-record entries
 */
export function createAuditRoutes(store: AuditStore): Router {
  const router = Router()

  // List all audit entries
  router.get('/', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0
      const model = req.query.model ? String(req.query.model) : undefined
      const action = req.query.action ? String(req.query.action) : undefined

      const result = store.getAll({ limit, offset, model, action })
      return res.json(result)
    } catch (error) {
      const err = error as Error
      console.error('Audit list error:', err)
      return res.status(500).json({ error: err.message || 'Internal server error' })
    }
  })

  // Get entries by model
  router.get('/:model', (req: Request, res: Response) => {
    try {
      const modelParam = req.params.model
      const model = Array.isArray(modelParam) ? modelParam[0] || '' : modelParam || ''
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined

      const entries = store.getByModel(model, limit)
      return res.json(entries)
    } catch (error) {
      const err = error as Error
      console.error('Audit by model error:', err)
      return res.status(500).json({ error: err.message || 'Internal server error' })
    }
  })

  // Get entries by record
  router.get('/:model/:id', (req: Request, res: Response) => {
    try {
      const modelParam = req.params.model
      const model = Array.isArray(modelParam) ? modelParam[0] || '' : modelParam || ''
      const idParam = req.params.id
      const id = Array.isArray(idParam) ? idParam[0] || '' : idParam || ''

      const entries = store.getByRecord(model, id)
      return res.json(entries)
    } catch (error) {
      const err = error as Error
      console.error('Audit by record error:', err)
      return res.status(500).json({ error: err.message || 'Internal server error' })
    }
  })

  return router
}
