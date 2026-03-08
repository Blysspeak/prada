# Backend Modules

The module system lets you extend PRADA's backend with custom routes, middleware, and business logic. Modules receive a context object with access to the Prisma client, parsed schema, Express router, and auth middleware.

## PradaModule Interface

```typescript
interface PradaModule {
  /** Module name (used in logs and debugging) */
  name: string

  /** Register custom routes. Called after auth and CRUD routes are mounted. */
  routes?: (ctx: PradaContext) => void | Promise<void>

  /** Global middleware applied to all routes before anything else. */
  middleware?: RequestHandler[]
}
```

## PradaContext

Every module's `routes` function receives a context object:

```typescript
interface PradaContext {
  /** Prisma client instance */
  prisma: PrismaClient

  /** Parsed database schema (models, fields, enums) */
  schema: Schema

  /** The Express router -- mount your routes here */
  router: Router

  /** Auth middleware -- use to protect custom routes */
  authMiddleware: RequestHandler

  /** Configuration */
  config: {
    cwd: string    // Working directory for config files
  }
}
```

## Creating a Module

A module is a plain object. Create it as a constant or a factory function:

```typescript
import { Router } from 'express'
import type { PradaModule, PradaContext } from '@blysspeak/prada'

const myModule: PradaModule = {
  name: 'my-module',
  routes: (ctx) => {
    const router = Router()

    router.get('/hello', (req, res) => {
      res.json({ message: 'Hello from my module' })
    })

    // Mount under /api and protect with auth
    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

## Registering Modules

Pass modules to `createPradaServer` via the `modules` option:

```typescript
import { createPradaServer } from '@blysspeak/prada'

app.use('/admin', await createPradaServer({
  prisma,
  modules: [myModule, statsModule, uploadModule]
}))
```

Modules are initialized in the order they appear in the array, after the built-in CRUD and auth routes are already mounted.

## Module with Custom Routes

The most common use case is adding API endpoints that work alongside the built-in CRUD:

```typescript
import { Router } from 'express'
import type { PradaModule } from '@blysspeak/prada'

const statsModule: PradaModule = {
  name: 'stats',
  routes: async (ctx) => {
    const router = Router()

    // GET /api/stats/overview
    router.get('/stats/overview', async (req, res) => {
      const models = ctx.schema.models

      const counts: Record<string, number> = {}
      for (const model of models) {
        const client = ctx.prisma[model.name.charAt(0).toLowerCase() + model.name.slice(1)]
        if (client?.count) {
          counts[model.name] = await client.count()
        }
      }

      res.json({ counts, modelCount: models.length })
    })

    // GET /api/stats/:model
    router.get('/stats/:model', async (req, res) => {
      const modelName = req.params.model
      const model = ctx.schema.models.find(
        m => m.name.toLowerCase() === modelName.toLowerCase()
      )

      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }

      const clientKey = model.name.charAt(0).toLowerCase() + model.name.slice(1)
      const count = await ctx.prisma[clientKey].count()

      res.json({
        model: model.name,
        fields: model.fields.length,
        records: count
      })
    })

    // Protected with auth
    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

## Module with Middleware

Use the `middleware` property to add Express middleware that runs on every request, before any route handler:

```typescript
import type { PradaModule } from '@blysspeak/prada'
import type { RequestHandler } from 'express'

const loggingMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`)
  })
  next()
}

const rateLimitMiddleware: RequestHandler = (() => {
  const requests = new Map<string, number[]>()
  const WINDOW = 60_000
  const MAX = 100

  return (req, res, next) => {
    const ip = req.ip || 'unknown'
    const now = Date.now()
    const timestamps = (requests.get(ip) || []).filter(t => now - t < WINDOW)

    if (timestamps.length >= MAX) {
      return res.status(429).json({ error: 'Too many requests' })
    }

    timestamps.push(now)
    requests.set(ip, timestamps)
    next()
  }
})()

const infrastructureModule: PradaModule = {
  name: 'infrastructure',
  middleware: [loggingMiddleware, rateLimitMiddleware]
}
```

## Real-World Example: File Upload Module

```typescript
import { Router } from 'express'
import multer from 'multer'
import { resolve } from 'path'
import type { PradaModule } from '@blysspeak/prada'

function createUploadModule(uploadDir: string = './uploads'): PradaModule {
  const storage = multer.diskStorage({
    destination: resolve(uploadDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      cb(null, `${unique}-${file.originalname}`)
    }
  })

  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

  return {
    name: 'upload',
    routes: (ctx) => {
      const router = Router()

      // POST /api/upload
      router.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' })
        }

        res.json({
          url: `/uploads/${req.file.filename}`,
          originalName: req.file.originalname,
          size: req.file.size
        })
      })

      // Protect upload endpoint with auth
      ctx.router.use('/api', ctx.authMiddleware, router)

      // Serve uploaded files (public, no auth)
      const { static: serveStatic } = require('express')
      ctx.router.use('/uploads', serveStatic(resolve(uploadDir)))
    }
  }
}

// Usage:
app.use('/admin', await createPradaServer({
  prisma,
  modules: [createUploadModule('./data/uploads')]
}))
```

## Real-World Example: Webhook Module

```typescript
import { Router } from 'express'
import type { PradaModule, PradaServerOptions } from '@blysspeak/prada'

function createWebhookModule(webhookUrl: string): PradaModule & {
  getHooks: () => PradaServerOptions['hooks']
} {
  async function notify(event: string, data: unknown) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    }).catch(err => console.error('Webhook failed:', err))
  }

  return {
    name: 'webhooks',
    // Provide hooks that the server can use
    getHooks: () => ({
      '*': {
        afterCreate: async (record, ctx) => {
          await notify(`${ctx.model}.created`, record)
        },
        afterUpdate: async (record, ctx) => {
          await notify(`${ctx.model}.updated`, record)
        },
        afterDelete: async (id, ctx) => {
          await notify(`${ctx.model}.deleted`, { id })
        }
      }
    }),
    routes: (ctx) => {
      const router = Router()

      // GET /api/webhooks/status
      router.get('/webhooks/status', (req, res) => {
        res.json({ url: webhookUrl, active: true })
      })

      ctx.router.use('/api', ctx.authMiddleware, router)
    }
  }
}

// Usage with hooks:
const webhooks = createWebhookModule('https://example.com/webhook')

app.use('/admin', await createPradaServer({
  prisma,
  modules: [webhooks],
  hooks: webhooks.getHooks()
}))
```

## Built-in Audit Module

PRADA itself uses the module pattern internally. The built-in audit system is implemented as a module that combines an in-memory store, CRUD hooks, and REST routes. When you pass `audit: true` to `createPradaServer`, it creates an audit module behind the scenes using `createAuditStore`, `createAuditHooks`, and `createAuditRoutes`. This is a good reference for how to structure modules that combine hooks with custom endpoints.

## Tips

- Module routes are mounted **after** the built-in CRUD routes. If you need to intercept a built-in route, use middleware instead.
- Always use `ctx.authMiddleware` to protect your custom endpoints unless you intentionally want them public.
- Use `ctx.schema` to make your modules schema-aware -- iterate over models, check field types, build dynamic endpoints.
- Module `middleware` runs on **every** request to the PRADA router, including static file requests. Keep it lightweight.
- For async initialization (database setup, external service connections), use an `async` routes function.
