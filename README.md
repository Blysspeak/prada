<p align="center">
  <img src="assets/prada-logo.png" alt="PRADA Logo" width="120" />
</p>

<h1 align="center">PRADA</h1>

<p align="center">
  <strong>PRisma ADmin — Modular admin panel for PostgreSQL</strong><br>
  Use ready solution or build your own from primitives.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#customization">Customization</a> •
  <a href="#api">API</a> •
  <a href="docs/INTEGRATION.md">Integration Guide</a>
</p>

---

## Quick Start

```bash
npm install @blysspeak/prada @blysspeak/prada-ui
```

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' }
}))

app.listen(3000)
```

Open `http://localhost:3000/admin`

## Architecture

PRADA has 3 abstraction levels — use what fits your needs:

| Level | API | Use Case |
|-------|-----|----------|
| **3** | `createPradaServer()` | Ready solution, zero config |
| **2** | Routes, Middleware, Handlers | Custom server assembly |
| **1** | Query builders, JWT, Sanitizers | Build from scratch |

## Level 3: Ready Solution

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' },

  hooks: {
    'User.beforeCreate': async (data) => ({ ...data, createdAt: new Date() }),
    '*.afterDelete': async (id, ctx) => console.log(`Deleted ${ctx.model}:${id}`)
  },

  models: {
    User: {
      actions: ['read', 'update'],
      fields: { password: { hidden: true } }
    }
  }
}))
```

## Level 2: Building Blocks

```typescript
import {
  parseSchema,
  createApiHandler,
  createCrudRoutes,
  createAuthService,
  createAuthMiddleware,
  createAuthRoutes
} from '@blysspeak/prada'

const router = Router()
const schema = await parseSchema()
const api = createApiHandler(prisma, schema)
const auth = createAuthService({ login: 'admin', password: 'secret' })

router.get('/api/stats', myStatsHandler)  // Custom route
router.use('/api/auth', createAuthRoutes(auth))
router.use('/api', createAuthMiddleware(auth), createCrudRoutes(api))
```

## Level 1: Primitives

```typescript
import {
  // Schema
  parseSchema, getModels, getEnums, getRelations,

  // Query
  buildWhereClause, buildOrderByClause, buildIncludeClause,

  // Data
  sanitizeInput, parseId, convertFieldValue,

  // Auth
  generateToken, verifyToken, hashPassword, comparePassword
} from '@blysspeak/prada'

const where = buildWhereClause(model, search, filters)
const users = await prisma.user.findMany({ where, take: 50 })
```

## UI Components

```typescript
import {
  // Pages
  LoginPage, DashboardPage, ModelListPage, ModelFormPage, ModelViewPage,

  // Components
  DataTable, DynamicForm, Layout, Sidebar,

  // Fields
  TextField, NumberField, BooleanField, DateTimeField, EnumField, JsonField,

  // Providers
  AuthProvider, SchemaProvider, useAuth, useSchema, useSettings
} from '@blysspeak/prada-ui'

function CustomPage() {
  const schema = useSchema()
  return <DataTable data={records} columns={schema.models.User.fields} />
}
```

## Customization

### Hooks

```typescript
createApiHandler(prisma, schema, {
  hooks: {
    '*': {  // All models
      beforeCreate: async (data, ctx) => data,
      afterCreate: async (record, ctx) => {},
      beforeUpdate: async (id, data, ctx) => data,
      afterUpdate: async (record, ctx) => {},
      beforeDelete: async (id, ctx) => {},
      afterDelete: async (id, ctx) => {},
      beforeFind: async (query, ctx) => query,
      afterFind: async (records, ctx) => records
    },
    User: {  // Specific model
      beforeCreate: async (data) => ({
        ...data, password: await hashPassword(data.password)
      })
    }
  }
})
```

### Model Config

```typescript
createApiHandler(prisma, schema, {
  models: {
    User: {
      actions: ['read'],  // read-only
      defaultSort: { field: 'createdAt', order: 'desc' },
      fields: {
        password: { hidden: true },
        email: { readonly: true },
        name: { label: 'Full Name' }
      }
    }
  }
})
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schema` | Schema metadata |
| GET | `/api/:model` | List with pagination |
| GET | `/api/:model/:id` | Single record |
| POST | `/api/:model` | Create |
| PUT | `/api/:model/:id` | Update |
| DELETE | `/api/:model/:id` | Delete |

**Query params:** `?page=1&limit=20&sort=name&order=asc&search=john&include=posts`

## Types

```typescript
import type {
  Schema, Model, Field, Enum,
  PrismaClient, ApiHandler,
  CrudHooks, ModelConfig,
  FindManyParams, PaginatedResponse
} from '@blysspeak/prada'
```

## Development

```bash
pnpm install
pnpm build
pnpm dev  # Watch mode
```

## Requirements

- Node.js 18+
- PostgreSQL
- Prisma schema

## License

MIT

## Author

[blysspeak](https://github.com/blysspeak)
