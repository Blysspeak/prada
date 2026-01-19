import { Router } from 'express'

export function createCrudRoutes(apiHandler) {
  const router = Router()
  const schema = apiHandler.getSchema()

  router.get('/schema', (req, res) => {
    return res.json(schema)
  })

  router.get('/:model', async (req, res) => {
    try {
      const { model } = req.params
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
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        sort,
        order,
        search,
        include,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      }

      const result = await apiHandler.findMany(model, params)
      return res.json(result)
    } catch (error) {
      console.error('Find many error:', error)
      return res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Internal server error'
      })
    }
  })

  router.get('/:model/:id', async (req, res) => {
    try {
      const { model, id } = req.params
      const { include } = req.query

      const result = await apiHandler.findOne(model, id, include)

      if (!result) {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.json({ data: result })
    } catch (error) {
      console.error('Find one error:', error)
      return res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Internal server error'
      })
    }
  })

  router.post('/:model', async (req, res) => {
    try {
      const { model } = req.params
      const data = req.body

      const result = await apiHandler.create(model, data)
      return res.status(201).json({ data: result })
    } catch (error) {
      console.error('Create error:', error)

      if (error.message?.includes('not allowed')) {
        return res.status(403).json({ error: error.message })
      }

      return res.status(500).json({
        error: error.message || 'Internal server error'
      })
    }
  })

  router.put('/:model/:id', async (req, res) => {
    try {
      const { model, id } = req.params
      const data = req.body

      const result = await apiHandler.update(model, id, data)
      return res.json({ data: result })
    } catch (error) {
      console.error('Update error:', error)

      if (error.message?.includes('not allowed')) {
        return res.status(403).json({ error: error.message })
      }

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.status(500).json({
        error: error.message || 'Internal server error'
      })
    }
  })

  router.delete('/:model/:id', async (req, res) => {
    try {
      const { model, id } = req.params

      await apiHandler.remove(model, id)
      return res.json({ success: true })
    } catch (error) {
      console.error('Delete error:', error)

      if (error.message?.includes('not allowed')) {
        return res.status(403).json({ error: error.message })
      }

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' })
      }

      return res.status(500).json({
        error: error.message || 'Internal server error'
      })
    }
  })

  return router
}
