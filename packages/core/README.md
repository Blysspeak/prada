# @blysspeak/prada-core

Core library for PRADA admin panel. Provides schema parsing and API generation for Prisma.

## Installation

```bash
npm install @blysspeak/prada-core
```

## Usage

```javascript
import { parseSchema, createApiHandler } from '@blysspeak/prada-core'

// Parse Prisma schema
const schema = await parseSchema('./prisma/schema.prisma')

// Create API handler
const apiHandler = createApiHandler(prisma, schema)

// Use in routes
const result = await apiHandler.findMany('User', { take: 10 })
```

## API

### parseSchema(schemaPath)

Parses a Prisma schema file and returns model definitions.

### createApiHandler(prisma, schema, options?)

Creates an API handler for CRUD operations.

### loadConfig(cwd?)

Loads PRADA configuration from `.prada/credentials` or environment.

### saveCredentials(login, password, cwd?)

Saves admin credentials securely.

### validateCredentials(login, password, config)

Validates login credentials against stored config.

## License

MIT
