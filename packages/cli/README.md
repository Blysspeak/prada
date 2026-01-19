# PRADA

**Fast admin for your projects** - Instant PostgreSQL database admin panel.

## Quick Start

```bash
npx prada "postgresql://user:password@localhost:5432/mydb"
```

That's it! PRADA will:
1. Connect to your database
2. Introspect the schema
3. Generate admin panel
4. Open it in your browser

## Features

- **Zero config** - Just provide a database URL
- **Auto schema detection** - Works with any PostgreSQL database
- **Beautiful UI** - Modern, responsive admin interface
- **Secure** - Local credentials, no data sent anywhere
- **Fast** - Built with performance in mind

## Usage

### With database URL

```bash
npx prada "postgresql://user:password@host:5432/database"
```

### With environment variable

```bash
DATABASE_URL="postgresql://..." npx prada
```

### Options

```bash
npx prada --help

Options:
  -p, --port <port>  Server port (default: 3000)
  -H, --host <host>  Server host (default: localhost)
  --no-open          Don't open browser automatically
```

## For Integration

If you want to integrate PRADA into your existing project, use `@prada/server`:

```bash
npm install @prada/server
```

```javascript
import { createPradaServer } from '@prada/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

app.use('/admin', await createPradaServer({ prisma }))
```

## License

MIT
