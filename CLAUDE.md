# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRADA (PRisma ADmin) is a zero-config admin panel generator for PostgreSQL databases. It auto-detects schema via Prisma introspection and generates a complete CRUD interface with authentication.

## Build Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages (required before running)
pnpm dev              # Run all packages in parallel dev mode

# Run the CLI
node packages/cli/dist/cli.js "postgresql://user:pass@localhost:5432/mydb"

# Build specific package
pnpm --filter @blysspeak/prada-ui build
pnpm --filter @blysspeak/prada-server build
pnpm --filter @blysspeak/prada-core build
```

## Architecture

This is a pnpm monorepo with four packages:

```
packages/
├── cli/      # CLI entry point - parses args, runs Prisma introspection, spawns server
├── core/     # Business logic - schema parser, API handler factory, auth utilities
├── server/   # Express middleware - routes, JWT auth, serves UI static files
└── ui/       # React SPA - Vite + TailwindCSS + React Query
```

**Data Flow:**
1. CLI receives database URL → runs `prisma db pull` to introspect schema
2. Core parses Prisma DMMF into model metadata (fields, types, relations)
3. Server mounts CRUD endpoints at `/api/:model` using Core's API generator
4. UI fetches schema metadata, renders dynamic forms/tables based on field types

**Key Technical Decisions:**
- Uses `@prisma/internals` for schema parsing (DMMF format)
- JWT stored in HTTP-only cookies (`prada_token`) or Authorization header
- UI base path is `/admin/` - all routes prefixed accordingly
- Credentials stored in `.prada/credentials` with SHA256+salt hashing

## Package Dependencies

- CLI depends on Core + Server
- Server depends on Core + UI (for static files)
- UI is standalone (built separately, served as static assets)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PRADA_LOGIN` / `PRADA_PASSWORD` - Skip setup wizard by providing credentials
- `PRADA_SECRET` - JWT secret (auto-generated if not set)

## UI Development

The UI uses Vite with dev server proxy:
- Dev server: `pnpm --filter @blysspeak/prada-ui dev` (runs on port 5173)
- Proxies `/admin/api/*` to `localhost:3000` (requires backend running)
- Path alias: `@/` maps to `src/`
