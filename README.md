<p align="center">
  <img src="assets/prada-logo.png" alt="PRADA Logo" width="120" />
</p>

<h1 align="center">PRADA</h1>

<p align="center">
  <strong>Fast admin for your projects</strong><br>
  Instant PostgreSQL database admin panel. Zero config.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#integration">Integration</a> •
  <a href="#cli-options">CLI Options</a>
</p>

---

## Quick Start

```bash
npx prada "postgresql://user:password@localhost:5432/mydb"
```

That's it! Browser opens automatically at `http://localhost:3000/admin`.

On first launch, you'll see a setup page to create admin credentials.

## Features

- **Zero config** — Just provide a database URL
- **Auto schema detection** — Works with any PostgreSQL database
- **Beautiful UI** — Modern dark theme with violet-cyan gradient
- **Secure** — JWT auth, local credentials storage
- **Fast** — Built with performance in mind
- **Two modes** — CLI for quick access, middleware for integration

## Installation

### Option 1: npx (Recommended)

No installation needed:

```bash
npx prada "postgresql://user:pass@host:5432/db"
```

### Option 2: Global Install

```bash
npm install -g prada
prada "postgresql://user:pass@host:5432/db"
```

### Option 3: Add to Project

```bash
npm install prada
```

Add to `package.json`:

```json
{
  "scripts": {
    "admin": "prada"
  }
}
```

Then run:

```bash
DATABASE_URL="postgresql://..." npm run admin
```

## Integration

For production apps, use `@prada/server` as Express middleware:

```bash
npm install @prada/server @prisma/client
```

```javascript
import express from 'express'
import { createPradaServer } from '@prada/server'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

// Mount admin panel at /admin
app.use('/admin', await createPradaServer({ prisma }))

app.listen(3000, () => {
  console.log('Admin panel: http://localhost:3000/admin')
})
```

## CLI Options

```
prada [database-url] [options]

Arguments:
  database-url         PostgreSQL connection string
                       Can also use DATABASE_URL env variable

Options:
  -p, --port <port>    Server port (default: 3000)
  -H, --host <host>    Server host (default: localhost)
  --no-open            Don't open browser automatically
  -h, --help           Show help
  -v, --version        Show version
```

### Examples

```bash
# Basic usage
npx prada "postgresql://user:pass@localhost:5432/mydb"

# Custom port
npx prada "postgresql://..." --port 8080

# Using environment variable
DATABASE_URL="postgresql://..." npx prada

# Don't open browser
npx prada "postgresql://..." --no-open
```

## Authentication

### First Launch

On first launch, PRADA shows a setup page where you create admin credentials.
Credentials are stored locally in `.prada/credentials`.

### Environment Variables

Skip setup by providing credentials via env:

```bash
PRADA_LOGIN=admin PRADA_PASSWORD=secret npx prada "postgresql://..."
```

## Packages

| Package | Description |
|---------|-------------|
| [`prada`](./packages/cli) | CLI for instant database admin |
| [`@prada/server`](./packages/server) | Express middleware for integration |
| [`@prada/core`](./packages/core) | Schema parser and API generator |
| [`@prada/ui`](./packages/ui) | React admin interface |

## Supported Features

| Feature | Status |
|---------|--------|
| PostgreSQL | ✅ |
| MySQL | 🔜 |
| SQLite | 🔜 |
| CRUD operations | ✅ |
| Relations | ✅ |
| Search & filters | ✅ |
| Pagination | ✅ |
| Sorting | ✅ |
| Dark/Light theme | ✅ |

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Express, Prisma
- **CLI**: citty, consola, picocolors
- **Auth**: JWT + bcrypt

## License

MIT

## Author

[blysspeak](https://github.com/blysspeak)
