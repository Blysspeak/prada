<p align="center">
  <img src="assets/prada-logo.png" alt="PRADA" width="120" />
</p>

<h1 align="center">PRADA</h1>

<p align="center">
  <strong>PRisma ADmin — Modular admin panel library for PostgreSQL</strong><br>
  Zero-config CRUD out of the box. Fully customizable when you need it.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@blysspeak/prada"><img src="https://img.shields.io/npm/v/@blysspeak/prada?color=blue&label=npm" alt="npm" /></a>
  <a href="https://github.com/blysspeak/prada/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
  <img src="https://img.shields.io/badge/typescript-5.7-blue" alt="typescript" />
</p>

<p align="center">
  <b>Documentation:</b>&nbsp;&nbsp;
  <a href="docs/en/getting-started.md">English</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="docs/ru/getting-started.md">Русский</a>
</p>

---

## What is PRADA?

PRADA turns any PostgreSQL database with a Prisma schema into a fully functional admin panel. It works as a library — not a framework — so you can drop it into an existing Express app, extend it with custom modules, and override any part of the UI.

**Use it as a foundation.** The database is already connected, CRUD already works, auth is handled. You focus on building your domain-specific admin logic on top.

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
// Admin panel at http://localhost:3000/admin
```

That's it. Every model in your Prisma schema now has list, create, edit, view, and delete pages.

---

## Key Features

- **Zero config** — auto-generates CRUD from Prisma schema
- **3-level API** — ready solution, building blocks, or primitives
- **Module system** — extend backend with custom routes and middleware
- **UI customization** — replace any field, cell, page, or section via a single config
- **Data hooks** — React Query hooks for custom pages (`useModelList`, `useModelCreate`, etc.)
- **Multi-file schema** — supports directory of `.prisma` files
- **JWT auth** — HTTP-only cookies, refresh tokens, setup wizard
- **i18n** — Russian and English out of the box
- **Themes** — dark and light with animated toggle
- **Advanced filters** — operator-based filtering (contains, gte, lte, in, etc.)
- **Bulk operations** — mass delete and update via API
- **Stats API** — per-model record counts and recent activity
- **Audit log** — automatic change tracking with diff history
- **Keyboard shortcuts** — navigate with hotkeys, `?` for help
- **Global search** — Ctrl+K command palette across all models
- **Inline editing** — double-click cells to edit in place
- **Relations UI** — autocomplete for foreign keys, clickable links
- **Data export** — CSV/JSON export with Excel compatibility
- **Dashboard widgets** — stats cards, quick actions, recent activity

---

## Architecture

PRADA provides 3 abstraction levels. Use what fits your needs:

### Level 3: Ready Solution

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema',  // single file or directory
  modules: [statsModule, uploadsModule],
  audit: true,  // Enable change tracking
  hooks: {
    '*': { beforeCreate: async (data) => ({ ...data, createdAt: new Date() }) },
    User: { beforeCreate: async (data) => ({ ...data, password: await hash(data.password) }) }
  },
  models: {
    User: { actions: ['read', 'update'], fields: { password: { hidden: true } } }
  }
}))
```

### Level 2: Building Blocks

```typescript
import {
  parseSchema, createApiHandler, createCrudRoutes,
  createAuthService, createAuthMiddleware, createAuthRoutes
} from '@blysspeak/prada'

const schema = await parseSchema()
const api = createApiHandler(prisma, schema, { hooks })
const auth = createAuthService({ login: 'admin', password: 'secret' })

router.use('/api/auth', createAuthRoutes(auth))
router.use('/api', createAuthMiddleware(auth), createCrudRoutes(api))
```

### Level 1: Primitives

```typescript
import {
  buildWhereClause, buildOrderByClause, parsePagination,
  generateToken, verifyToken, hashPassword,
  getScalarFields, getIdField, getSearchableFields
} from '@blysspeak/prada'
```

---

## Backend Modules

Extend the admin panel with custom backend logic:

```typescript
import { Router } from 'express'
import type { PradaModule } from '@blysspeak/prada'

const statsModule: PradaModule = {
  name: 'stats',
  routes: async (ctx) => {
    const router = Router()

    router.get('/stats/overview', async (req, res) => {
      const users = await ctx.prisma.user.count()
      const orders = await ctx.prisma.order.count()
      res.json({ users, orders })
    })

    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}

app.use('/admin', await createPradaServer({
  prisma,
  modules: [statsModule]
}))
```

The module receives `PradaContext` with `prisma`, `schema`, `router`, `authMiddleware`, and `config`.

---

## UI Customization

The entire UI is customizable through a single `PradaConfig` object:

```tsx
import { App } from '@blysspeak/prada-ui'

<App config={{
  // Custom form fields
  fields: {
    byType: { json: MonacoJsonEditor },
    byName: { avatar: AvatarUpload },
    byModelField: { User: { bio: RichTextEditor } }
  },

  // Custom table cells
  cells: {
    byName: { status: StatusBadge },
    byModelField: { Order: { total: CurrencyCell } }
  },

  // Replace entire pages
  pages: {
    dashboard: CustomDashboard
  },

  // Insert components into pages
  slots: {
    listHeader: ({ model }) => <StatsBar model={model} />,
    formFooter: ({ model }) => <AuditLog model={model} />
  },

  // Add custom routes (appear in sidebar)
  routes: [
    { path: '/analytics', element: AnalyticsPage,
      sidebar: { label: 'Analytics', icon: BarChart } }
  ],

  // Configure sidebar
  sidebar: {
    hiddenModels: ['_prisma_migrations'],
    modelLabels: { User: 'Team Members' },
    logo: CustomLogo
  },

  // Configure table actions
  actions: {
    rowActions: { Order: [ExportButton, RefundButton] },
    hideActions: { AuditLog: ['edit', 'delete'] }
  }
}} />
```

**Field resolution priority:** `model+field` > `field name` > `field type` > default component.

---

## Data Hooks

Build custom pages with easy database access:

```tsx
import {
  useModelList, useModelRecord,
  useModelCreate, useModelUpdate, useModelDelete
} from '@blysspeak/prada-ui'

function OrdersPage() {
  const { data, meta, isLoading } = useModelList('Order', {
    sort: 'createdAt',
    order: 'desc',
    filters: { status: 'pending' },
    page: 1,
    limit: 50
  })

  const { mutate: updateOrder } = useModelUpdate('Order')
  const { mutate: deleteOrder } = useModelDelete('Order')

  return (
    <div>
      <h1>Pending Orders ({meta.total})</h1>
      {data.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onApprove={() => updateOrder({ id: order.id, data: { status: 'approved' } })}
          onDelete={() => deleteOrder(order.id)}
        />
      ))}
    </div>
  )
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/schema` | Schema metadata (models, fields, enums) |
| `GET` | `/api/:model` | List records with pagination |
| `GET` | `/api/:model/:id` | Get single record |
| `POST` | `/api/:model` | Create record |
| `PUT` | `/api/:model/:id` | Update record |
| `DELETE` | `/api/:model/:id` | Delete record |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user |
| `POST` | `/api/auth/refresh` | Refresh token |
| `GET` | `/api/stats` | Per-model record counts |
| `DELETE` | `/api/:model/bulk` | Bulk delete records |
| `PUT` | `/api/:model/bulk` | Bulk update records |
| `GET` | `/api/audit` | Audit log entries |
| `GET` | `/api/audit/:model` | Audit log for model |
| `GET` | `/api/audit/:model/:id` | Audit log for record |

**Query parameters:** `?page=1&limit=20&sort=createdAt&order=desc&search=john&include=posts,comments`

Supports operator filters: `?field__contains=value&field__gte=10`

---

## Documentation

### English

| Document | Description |
|----------|-------------|
| [Getting Started](docs/en/getting-started.md) | Installation, basic usage, environment variables |
| [Architecture](docs/en/architecture.md) | 3-level abstraction, project structure, data flow |
| [UI Customization](docs/en/customization.md) | PradaConfig, fields, cells, pages, slots, routes, sidebar |
| [Backend Modules](docs/en/modules.md) | PradaModule, PradaContext, custom routes |
| [Data Hooks](docs/en/data-hooks.md) | useModelList, useModelRecord, useModelCreate, etc. |
| [API Reference](docs/en/api-reference.md) | All exports, REST endpoints, TypeScript types |

### Русский

| Документ | Описание |
|----------|----------|
| [Быстрый старт](docs/ru/getting-started.md) | Установка, базовое использование, переменные окружения |
| [Архитектура](docs/ru/architecture.md) | 3 уровня абстракции, структура проекта, поток данных |
| [Кастомизация UI](docs/ru/customization.md) | PradaConfig, поля, ячейки, страницы, слоты, роуты, сайдбар |
| [Модули бэкенда](docs/ru/modules.md) | PradaModule, PradaContext, кастомные роуты |
| [Data Hooks](docs/ru/data-hooks.md) | useModelList, useModelRecord, useModelCreate и др. |
| [Справочник API](docs/ru/api-reference.md) | Все экспорты, REST-эндпоинты, TypeScript типы |

---

## Packages

| Package | Description |
|---------|-------------|
| [`@blysspeak/prada`](https://www.npmjs.com/package/@blysspeak/prada) | Backend — Express middleware, schema parser, CRUD API, auth, module system |
| [`@blysspeak/prada-ui`](https://www.npmjs.com/package/@blysspeak/prada-ui) | Frontend — React components, data hooks, customization system |

---

## Requirements

- Node.js 18+
- PostgreSQL
- Prisma schema (`schema.prisma` or directory of `.prisma` files)

## Development

```bash
git clone https://github.com/blysspeak/prada.git
cd prada
pnpm install
pnpm build        # Build all packages
pnpm dev          # UI dev server with hot reload
```

```bash
pnpm build:main   # Backend only
pnpm build:ui     # UI only
```

## License

MIT

## Author

[blysspeak](https://github.com/blysspeak)
