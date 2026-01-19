# PRADA

**Fast admin for your projects** — Universal admin panel for PostgreSQL databases.

## Quick Start

```bash
npx prada "postgresql://user:password@localhost:5432/mydb"
```

That's it! Open http://localhost:3000/admin and manage your data.

## Features

- **Zero config** — Just provide a database URL
- **Auto schema detection** — Works with any PostgreSQL database
- **Beautiful UI** — Modern dark theme with violet-cyan gradient
- **Secure** — JWT auth, local credentials storage
- **Fast** — Built with performance in mind
- **Two modes** — CLI for quick access, middleware for integration

## Installation

### CLI Mode (Quick Access)

```bash
# Run directly with npx
npx prada "postgresql://user:pass@host:5432/db"

# Or install globally
npm install -g prada
prada "postgresql://..."
```

### Integration Mode (Production)

```bash
npm install @prada/server
```

```javascript
import express from 'express'
import { createPradaServer } from '@prada/server'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use('/admin', await createPradaServer({ prisma }))

app.listen(3000)
```

## Packages

| Package | Description |
|---------|-------------|
| `prada` | CLI for instant database admin |
| `@prada/server` | Express middleware for integration |
| `@prada/core` | Schema parser and API generator |
| `@prada/ui` | React admin interface |

## CLI Options

```bash
prada [database-url] [options]

Options:
  -p, --port <port>  Server port (default: 3000)
  -H, --host <host>  Server host (default: localhost)
  --no-open          Don't open browser automatically
  --help             Show help
```

## Authentication

On first launch, PRADA shows a setup page to create admin credentials.

Or use environment variables:

```bash
PRADA_LOGIN=admin PRADA_PASSWORD=secret npx prada "postgresql://..."
```

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Express, Prisma
- **CLI**: citty, consola, picocolors
- **Auth**: JWT + SHA-256

## Project Structure

```
prada/
├── packages/
│   ├── cli/      # npx prada
│   ├── core/     # Schema parser, API
│   ├── server/   # Express middleware
│   └── ui/       # React frontend
└── docs/
```

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
| i18n (en/ru) | ✅ |

## License

MIT

## Author

[blysspeak](https://github.com/blysspeak)
