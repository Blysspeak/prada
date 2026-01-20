# @blysspeak/prada-server

Express middleware for PRADA admin panel. Integrate beautiful database admin into your existing project.

## Installation

```bash
npm install @blysspeak/prada-server
```

## Usage

```javascript
import express from 'express'
import { createPradaServer } from '@blysspeak/prada-server'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

// Mount PRADA admin at /admin
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema.prisma' // optional
}))

app.listen(3000)
```

## Options

```typescript
interface PradaServerOptions {
  prisma: PrismaClient       // Required: Prisma client instance
  schemaPath?: string        // Path to schema.prisma (auto-detected)
  models?: object            // Custom model configurations
  auth?: {                   // Custom auth (optional)
    login: string
    password: string
  }
  staticPath?: string        // Custom UI path
  cwd?: string               // Working directory for config
}
```

## Authentication

On first access, PRADA shows a setup page to create admin credentials.
Credentials are stored locally in `.prada/credentials` (add to `.gitignore`).

Or use environment variables:

```bash
PRADA_LOGIN=admin
PRADA_PASSWORD=secret
```

## Standalone Mode

For quick database access without integration, use the CLI:

```bash
npx @blysspeak/prada "postgresql://user:pass@host:5432/db"
```

## License

MIT
