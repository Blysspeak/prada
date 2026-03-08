# Getting Started

This guide walks you through installing PRADA and running your first admin panel.

## Requirements

- **Node.js** 18 or later
- **pnpm** (recommended) or npm
- **PostgreSQL** database with an existing schema
- **Prisma** 5+ (as a peer dependency)

## Installation

Install the backend and UI packages:

```bash
npm install @blysspeak/prada @blysspeak/prada-ui
```

Or with pnpm:

```bash
pnpm add @blysspeak/prada @blysspeak/prada-ui
```

PRADA expects `@prisma/client` as a peer dependency. Make sure you have it installed and generated:

```bash
pnpm add prisma @prisma/client
npx prisma generate
```

## Basic Usage

The fastest way to get a working admin panel is with `createPradaServer`. It handles schema parsing, CRUD endpoints, authentication, and UI serving in a single call.

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

const admin = await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' }
})

app.use('/admin', admin)

app.listen(3000, () => {
  console.log('Admin panel: http://localhost:3000/admin')
})
```

Open `http://localhost:3000/admin` in your browser, log in with the credentials you provided, and you will see a fully functional CRUD interface for every model in your Prisma schema.

## Environment Variables

Instead of hardcoding credentials, you can use environment variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Required by Prisma |
| `PRADA_LOGIN` | Admin login (skips setup wizard) | None |
| `PRADA_PASSWORD` | Admin password (skips setup wizard) | None |
| `PRADA_SECRET` | JWT signing secret | Auto-generated |

When `PRADA_LOGIN` and `PRADA_PASSWORD` are not set and no credentials file exists, PRADA shows a setup wizard on first visit where you create credentials interactively.

## Schema Path

By default, PRADA looks for your Prisma schema in these locations (in order):

1. `prisma/schema.prisma`
2. `prisma/schema/` (directory of `.prisma` files)
3. `schema.prisma`
4. `src/prisma/schema.prisma`

You can override this with the `schemaPath` option:

```typescript
await createPradaServer({
  prisma,
  schemaPath: './prisma/schema',  // directory of modular .prisma files
})
```

## Running in Dev Mode

For development with the monorepo source:

```bash
git clone https://github.com/blysspeak/prada.git
cd prada
pnpm install
pnpm build        # Build all packages
pnpm dev          # Run UI dev server with hot reload
```

The UI dev server runs on port 5173 and proxies API requests to `localhost:3000`. You need the backend running separately for the proxy to work.

## Building for Production

```bash
pnpm build
```

This builds both the backend (`tsup`) and the UI (`vite build`). The compiled output goes to `dist/` in each package. The backend automatically resolves and serves the built UI static files.

## Disabling Authentication

For development or internal tools where auth is not needed:

```typescript
await createPradaServer({
  prisma,
  auth: { disabled: true }
})
```

## Adding Hooks, Modules, and Audit

Once your admin panel is running, you can extend it with lifecycle hooks, custom modules, and built-in audit logging:

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' },
  hooks: {
    '*': {
      beforeCreate: async (data) => ({ ...data, createdAt: new Date() })
    }
  },
  modules: [myModule],
  audit: true
}))
```

With `audit: true`, PRADA automatically tracks all create, update, and delete operations and exposes an audit log page in the UI.

## Next Steps

- [Architecture](./architecture.md) -- understand the 3-level abstraction model
- [UI Customization](./customization.md) -- customize fields, cells, pages, sidebar, and routes
- [Backend Modules](./modules.md) -- extend the server with custom endpoints
- [Data Hooks](./data-hooks.md) -- use React hooks for CRUD in custom pages
- [API Reference](./api-reference.md) -- complete list of exports, types, and REST endpoints
- Audit log page -- when `audit: true` is enabled, view a full change history in the UI
