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
  <a href="#usage">Usage</a> •
  <a href="#integration">Integration</a>
</p>

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/blysspeak/prada.git
cd prada

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run with your database
node packages/cli/dist/cli.js "postgresql://user:password@localhost:5432/mydb"
```

Browser opens automatically at `http://localhost:3000/admin`.

On first launch, you'll see a setup page to create admin credentials.

## Features

- **Zero config** — Just provide a database URL
- **Auto schema detection** — Works with any PostgreSQL database
- **Beautiful UI** — Modern dark theme with violet-cyan gradient
- **Secure** — JWT auth, local credentials storage
- **Fast** — Built with performance in mind
- **Two modes** — CLI for quick access, middleware for integration

## Requirements

- Node.js 18+
- pnpm 8+
- PostgreSQL database

## Usage

### CLI Mode

```bash
# Basic usage
node packages/cli/dist/cli.js "postgresql://user:pass@localhost:5432/mydb"

# Custom port
node packages/cli/dist/cli.js "postgresql://..." --port 8080

# Using environment variable
DATABASE_URL="postgresql://..." node packages/cli/dist/cli.js

# Don't open browser
node packages/cli/dist/cli.js "postgresql://..." --no-open
```

### CLI Options

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
```

## Integration

For production apps, use `@blysspeak/prada-server` as Express middleware:

```javascript
import express from 'express'
import { createPradaServer } from '@blysspeak/prada-server'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

// Mount admin panel at /admin
app.use('/admin', await createPradaServer({ prisma }))

app.listen(3000, () => {
  console.log('Admin panel: http://localhost:3000/admin')
})
```

## Authentication

### First Launch

On first launch, PRADA shows a setup page where you create admin credentials.
Credentials are stored locally in `.prada/credentials`.

### Environment Variables

Skip setup by providing credentials via env:

```bash
PRADA_LOGIN=admin PRADA_PASSWORD=secret node packages/cli/dist/cli.js "postgresql://..."
```

## Project Structure

```
prada/
├── packages/
│   ├── cli/      # CLI entry point
│   ├── core/     # Schema parser, API generator
│   ├── server/   # Express middleware
│   └── ui/       # React frontend
└── assets/       # Logo and images
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @prada/ui build
pnpm --filter @blysspeak/prada-server build
pnpm --filter @prada/core build
pnpm --filter prada build
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

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Express, Prisma
- **CLI**: citty, consola, picocolors
- **Auth**: JWT + bcrypt

## License

MIT

## Author

[blysspeak](https://github.com/blysspeak)
