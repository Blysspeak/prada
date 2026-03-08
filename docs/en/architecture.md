# Architecture

PRADA is built around a 3-level abstraction model. Each level gives you more control at the cost of more setup. You can mix levels freely -- use Level 3 for the main app and drop to Level 1 when you need fine-grained control over a specific operation.

## Three Levels of Abstraction

### Level 3: Ready-to-Use Solution

A single function call that gives you a complete admin panel:

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' },
  hooks: {
    '*': {
      beforeCreate: async (data) => ({ ...data, createdAt: new Date() })
    }
  },
  modules: [statsModule],
  audit: true
}))
```

`createPradaServer` handles schema parsing, CRUD route creation, authentication setup, module initialization, and static file serving. It returns a standard Express `Router` that you mount at any path.

### Level 2: Building Blocks

Use individual factories to assemble your own server with full control over middleware order, route mounting, and authentication:

```typescript
import { Router, json } from 'express'
import {
  parseSchema,
  createApiHandler,
  createAuthService,
  createAuthMiddleware,
  createAuthRoutes,
  createCrudRoutes,
  serveUI
} from '@blysspeak/prada'

const router = Router()
router.use(json())

// Parse schema
const schema = await parseSchema('./prisma/schema.prisma')

// Create API handler with hooks and model configs
const api = createApiHandler(prisma, schema, {
  hooks: {
    User: { afterCreate: async (record) => sendWelcomeEmail(record) }
  },
  models: {
    User: {
      fields: { password: { hidden: true } },
      actions: ['read', 'update']
    }
  }
})

// Auth
const auth = createAuthService({ login: 'admin', password: 'secret' })
const authMiddleware = createAuthMiddleware(auth)

// Mount routes
router.use('/api/auth', createAuthRoutes(auth))
router.use('/api', authMiddleware, createCrudRoutes(api))

// Serve UI
serveUI(router)
```

### Level 1: Primitives

Low-level utilities for building custom logic:

```typescript
import {
  buildWhereClause,
  buildOrderByClause,
  parsePagination,
  generateToken,
  verifyToken,
  getScalarFields,
  getIdField,
  getSearchableFields
} from '@blysspeak/prada'

// Build a Prisma query from user input
const where = buildWhereClause(model, searchQuery, { status: 'active' })
const orderBy = buildOrderByClause('createdAt', 'desc')
const { skip, take } = parsePagination(page, limit)

// Use directly with Prisma
const results = await prisma.user.findMany({ where, orderBy, skip, take })

// JWT operations
const token = generateToken({ email: 'admin', role: 'admin' }, secret)
const payload = verifyToken(token, secret)
```

## Project Structure

```
src/                          # Backend (@blysspeak/prada)
  index.ts                    # All public exports
  server.ts                   # createPradaServer (Level 3)
  types.ts                    # Re-exports all public types
  api/
    handler.ts                # createApiHandler factory
    routes.ts                 # createCrudRoutes (Express router)
    query-builder.ts          # buildWhereClause, buildOrderByClause, etc.
    sanitizer.ts              # Input validation and type conversion
    types.ts                  # API types (hooks, configs, handler interface)
    operations/
      findMany.ts             # List with pagination, search, filters
      findOne.ts              # Get single record
      create.ts               # Create with validation and hooks
      update.ts               # Update with validation and hooks
      delete.ts               # Delete with hooks
      bulkDelete.ts           # Bulk delete operation
      bulkUpdate.ts           # Bulk update operation
      stats.ts                # Per-model statistics
    audit/
      types.ts                # Audit entry types
      store.ts                # In-memory ring buffer store
      hooks.ts                # Auto-tracking CRUD hooks
      routes.ts               # Audit log REST endpoints
      index.ts                # Barrel export
  auth/
    routes.ts                 # Login, logout, refresh endpoints
    middleware.ts             # JWT verification middleware
    service.ts                # Auth service factory
    setup.ts                  # First-run setup wizard endpoints
    config.ts                 # Credential file management
    jwt.ts                    # Token generation and verification
    password.ts               # Password hashing (SHA256 + bcrypt)
    types.ts                  # Auth types
  schema/
    parser.ts                 # Prisma DMMF parsing (file and directory)
    index.ts                  # Schema helper functions
    types.ts                  # Schema types (Model, Field, Enum)
  ui/
    serve.ts                  # Static file serving and SPA fallback

packages/ui/                  # UI (@blysspeak/prada-ui)
  src/
    App.tsx                   # Main app component (accepts PradaConfig)
    api.ts                    # HTTP client for backend API
    index.ts                  # All public exports
    types.ts                  # Frontend schema types
    customization/
      types.ts                # PradaConfig and all customization types
      PradaProvider.tsx        # React context for config
      useFieldComponent.ts     # Field component resolution hook
      useCellRenderer.ts       # Cell renderer resolution hook
    hooks/
      useModelData.ts          # CRUD data hooks (useModelList, etc.)
      useKeyboardShortcuts.ts  # Global keyboard shortcuts
      useColumnConfig.ts       # Column visibility/order
      useGlobalSearch.ts       # Cross-model search
      useRelationOptions.ts    # FK autocomplete data
    pages/                     # Built-in pages (Dashboard, List, Form, View)
    components/
      DataTable/               # Table with sorting, pagination
      Form/                    # Dynamic form with field rendering
      Fields/                  # Built-in field components
      Layout/                  # Shell with sidebar and header
      Settings/                # Theme and language settings
      Filters/                 # Advanced filter panel
      Search/                  # Global search (Ctrl+K)
      Dashboard/               # Stats cards, quick actions
      Audit/                   # Change diff display
      KeyboardShortcuts/       # Shortcuts help modal
    providers/                 # Auth, Schema, Settings, Setup contexts
    i18n/                      # Translation system (en/ru)
```

## Package Dependencies

```
@blysspeak/prada (backend)
  depends on: express, @prisma/internals, jsonwebtoken, bcrypt, cors, cookie-parser
  peer: @prisma/client

@blysspeak/prada-ui (frontend)
  depends on: react, react-router-dom, @tanstack/react-query, react-hook-form
  built as: static files served by the backend
```

The backend resolves the UI package at runtime to serve its built static files. There is no runtime import between the two -- the UI communicates with the backend exclusively via HTTP.

## Data Flow

The full request lifecycle looks like this:

```
1. Prisma schema file(s)
     |
     v
2. parseSchema() reads .prisma files, calls @prisma/internals getDMMF()
     |
     v
3. Schema object (models, fields, enums, relations)
     |
     v
4. createApiHandler() wraps Prisma client with schema-aware CRUD operations
     |
     v
5. createCrudRoutes() mounts Express routes: GET/POST/PUT/DELETE /:model[/:id]
     |
     v
6. Auth middleware verifies JWT from cookie or Authorization header
     |
     v
7. UI fetches GET /api/schema to discover models, renders dynamic tables and forms
     |
     v
8. User actions trigger CRUD requests, hooks run before/after each operation
```

## Schema Parsing

PRADA supports two schema layouts:

**Single file** -- the standard `prisma/schema.prisma`:

```typescript
const schema = await parseSchema('./prisma/schema.prisma')
```

**Directory of files** -- for large schemas split across multiple `.prisma` files:

```
prisma/schema/
  base.prisma       # datasource and generator
  user.prisma        # User model
  post.prisma        # Post model
  enums.prisma       # Shared enums
```

```typescript
const schema = await parseSchema('./prisma/schema')
```

Files are read in alphabetical order and concatenated before parsing.

## Authentication Flow

1. **First run (no credentials):** The UI shows a setup wizard. The user enters a login and password, which are hashed with SHA256+salt and saved to `.prada/credentials` in the working directory.

2. **Login:** The user submits credentials to `POST /api/auth/login`. The server validates them and returns two HTTP-only cookies: `prada_token` (access token, 1 hour) and `prada_refresh` (refresh token, 7 days).

3. **Authenticated requests:** Every API request includes the `prada_token` cookie. The auth middleware verifies the JWT signature and expiration.

4. **Token refresh:** When the access token expires, the UI automatically calls `POST /api/auth/refresh` using the refresh token cookie to get a new access token.

5. **Logout:** `POST /api/auth/logout` clears both cookies.

You can bypass the setup wizard entirely by passing `auth.login` and `auth.password` to `createPradaServer`, or by setting the `PRADA_LOGIN` and `PRADA_PASSWORD` environment variables.
