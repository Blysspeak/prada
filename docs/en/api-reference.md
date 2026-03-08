# API Reference

Complete reference for all exports, REST endpoints, and TypeScript types.

## Backend Exports (`@blysspeak/prada`)

### Level 3: Ready Solution

| Export | Description |
|---|---|
| `createPradaServer(options)` | Create a complete admin server as Express middleware |
| `PradaServerOptions` | Options for `createPradaServer` |
| `PradaContext` | Context object passed to modules |
| `PradaModule` | Module interface for extending the server |

### Level 2: Building Blocks

**Routes:**

| Export | Description |
|---|---|
| `createCrudRoutes(apiHandler)` | Express router with CRUD endpoints |
| `createAuthRoutes(authService)` | Express router with auth endpoints |
| `createSetupRoutes(cwd?)` | Express router with setup wizard endpoints |

**Middleware:**

| Export | Description |
|---|---|
| `createAuthMiddleware(authService)` | Middleware that requires valid JWT |
| `createOptionalAuthMiddleware(authService)` | Middleware that attaches user if token present, but does not reject |

**Factories:**

| Export | Description |
|---|---|
| `createApiHandler(prisma, schema, options?)` | Create CRUD handler with hooks and model configs |
| `createAuthService(config)` | Create auth service from plain config |
| `createAuthServiceFromConfig(loadedConfig)` | Create auth service from file-based config |

**Schema:**

| Export | Description |
|---|---|
| `parseSchema(schemaPath?)` | Parse Prisma schema file or directory |
| `parseDMMF(schemaContent)` | Parse schema from raw content string |

**Config:**

| Export | Description |
|---|---|
| `loadConfig(cwd?)` | Load credentials from `.prada/credentials` file |
| `isConfigured(cwd?)` | Check if credentials exist |
| `saveCredentials(login, password, cwd?)` | Save hashed credentials to file |
| `deleteCredentials(cwd?)` | Delete credentials file |

**Audit:**

| Export | Description |
|---|---|
| `createAuditStore(options?)` | Create in-memory audit store (ring buffer) |
| `createAuditHooks(store)` | Create CRUD hooks for automatic audit tracking |
| `createAuditRoutes(store)` | Express router for audit log endpoints |

**UI Serving:**

| Export | Description |
|---|---|
| `resolveUIPath()` | Resolve path to built UI static files |
| `serveUI(router)` | Mount static file serving and SPA fallback on router |
| `createSpaHandler(staticPath)` | Create SPA fallback middleware |
| `uiFilesExist()` | Check if built UI files are available |

### Level 1: Primitives

**Schema Utilities:**

| Export | Signature | Description |
|---|---|---|
| `getModelByName` | `(schema, name) => Model \| undefined` | Case-insensitive model lookup |
| `getModels` | `(schema) => Record<string, Model>` | All models as a name-keyed map |
| `getEnums` | `(schema) => Record<string, Enum>` | All enums as a name-keyed map |
| `getScalarFields` | `(model) => Field[]` | Non-relation fields |
| `getRelationFields` | `(model) => Field[]` | Relation fields only |
| `getIdField` | `(model) => Field \| undefined` | Primary key field |
| `getSearchableFields` | `(model) => Field[]` | String fields eligible for search |
| `getRequiredFields` | `(model) => Field[]` | Required fields without defaults |
| `getRelations` | `(schema) => Relation[]` | All relations with both sides |

**Query Builder:**

| Export | Signature | Description |
|---|---|---|
| `buildWhereClause` | `(model, search?, filters?) => where` | Build Prisma `where` from search and filters |
| `buildOrderByClause` | `(sort?, order?, default?) => orderBy` | Build Prisma `orderBy` |
| `buildIncludeClause` | `(model, include?) => include` | Build Prisma `include` from comma-separated string |
| `buildSelectClause` | `(model, fieldsConfig?) => select` | Build Prisma `select` excluding hidden fields |
| `parsePagination` | `(page?, limit?, maxLimit?) => { skip, take, page, limit }` | Parse and clamp pagination params |

**CRUD Operation Factories:**

| Export | Description |
|---|---|
| `createFindMany(ctx)` | Create a findMany operation with hooks and pagination |
| `createFindOne(ctx)` | Create a findOne operation |
| `createCreate(ctx)` | Create a create operation with validation and hooks |
| `createUpdate(ctx)` | Create an update operation with validation and hooks |
| `createDelete(ctx)` | Create a delete operation with hooks |
| `createBulkDelete(ctx)` | Create a bulk delete operation |
| `createBulkUpdate(ctx)` | Create a bulk update operation |

**Sanitizer:**

| Export | Description |
|---|---|
| `convertFieldValue(value, field)` | Convert string input to proper type for a field |
| `sanitizeInput(data, model, schema)` | Strip unknown and readonly fields from input |
| `validateRequired(data, model)` | Check that all required fields are present |
| `validateInput(data, model, schema)` | Full validation (sanitize + validate required) |
| `parseId(id, model)` | Parse string ID to number if the ID field is numeric |

**JWT:**

| Export | Description |
|---|---|
| `generateToken(payload, secret, expiresIn?)` | Create a signed JWT |
| `generateRefreshToken(payload, secret, expiresIn?)` | Create a refresh JWT |
| `generateTokens(user, secret)` | Create both access and refresh tokens |
| `verifyToken(token, secret)` | Verify and decode a JWT |
| `decodeToken(token)` | Decode without verification |
| `isTokenExpired(token)` | Check if a token has expired |

**Password:**

| Export | Description |
|---|---|
| `hashPassword(password)` | Hash with SHA256 + random salt, returns `{ hash, salt }` |
| `verifyPassword(password, hash, salt)` | Verify SHA256-hashed password |
| `comparePassword(password, hash)` | Compare with bcrypt hash |
| `hashPasswordBcrypt(password)` | Hash with bcrypt |

---

## UI Exports (`@blysspeak/prada-ui`)

### App

| Export | Description |
|---|---|
| `App` | Main app component, accepts `config?: PradaConfig` |
| `AppProps` | Props type for App |

### Customization

| Export | Description |
|---|---|
| `PradaProvider` | React context provider for PradaConfig |
| `usePrada()` | Hook to access current PradaConfig |
| `useFieldComponent(field, model)` | Resolve field component with override priority |
| `useCellRenderer(field, model)` | Resolve cell renderer with override priority |

### Data Hooks

| Export | Description |
|---|---|
| `useModelList(model, params?)` | Paginated list query |
| `useModelRecord(model, id, options?)` | Single record query |
| `useModelCreate(model)` | Create mutation |
| `useModelUpdate(model)` | Update mutation |
| `useModelDelete(model)` | Delete mutation |
| `useKeyboardShortcuts(shortcuts)` | Register global keyboard shortcuts |
| `useColumnConfig(model)` | Column visibility and order state |
| `useGlobalSearch()` | Cross-model search across all models |
| `useRelationOptions(model, field)` | FK autocomplete options for a relation field |

### Pages

| Export | Description |
|---|---|
| `LoginPage` | Built-in login page |
| `SetupPage` | First-run setup wizard |
| `DashboardPage` | Default dashboard |
| `ModelListPage` | Table view for a model |
| `ModelFormPage` | Create/edit form for a model |
| `ModelViewPage` | Detail view for a record |

### Components

| Export | Description |
|---|---|
| `DataTable` | Sortable data table with pagination |
| `Pagination` | Pagination controls |
| `CellValue` | Default cell value renderer |
| `DynamicForm` | Form that renders fields based on schema |
| `FieldRenderer` | Renders a single form field |
| `Layout` | Shell with sidebar and content area |
| `Sidebar` | Navigation sidebar |
| `SettingsModal` | Theme and language settings dialog |
| `AnimatedThemeToggler` | Dark/light mode toggle |
| `GlobalSearch` | Cross-model search dialog (Ctrl+K) |
| `ShortcutsHelp` | Keyboard shortcuts help modal |
| `FilterPanel` | Advanced filter panel with operators |
| `ExportButton` | Export table data (CSV/JSON) |
| `ColumnPicker` | Column visibility and order picker |
| `InlineEditor` | Inline cell editing component |
| `RelationField` | FK field with autocomplete |
| `AuditLogPage` | Audit log viewer page |
| `ChangesDiff` | Side-by-side change diff display |

### Form Fields

| Export | Description |
|---|---|
| `TextField` | Text input field |
| `NumberField` | Number input field |
| `BooleanField` | Checkbox/toggle field |
| `DateTimeField` | Date/time picker field |
| `EnumField` | Dropdown select for enum values |
| `JsonField` | JSON editor field |

### Providers

| Export | Description |
|---|---|
| `AuthProvider` / `useAuth()` | Authentication state |
| `SchemaProvider` / `useSchema()` | Schema data |
| `SettingsProvider` / `useSettings()` | Theme, language, date format |
| `SetupProvider` / `useSetup()` | Setup wizard state |
| `formatDate(date, format)` | Format a date using current locale |

### i18n

| Export | Description |
|---|---|
| `useTranslation()` | Returns `t(key)` function for translations |
| `pluralize(n, forms)` | Russian-aware pluralization |
| `translations` | Translation dictionary object |

### Utilities

| Export | Description |
|---|---|
| `api` | HTTP client for the PRADA backend |
| `cn(...classes)` | Tailwind class merge utility |

---

## REST API Endpoints

All endpoints are relative to the mount path (e.g., `/admin`).

### Schema

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/schema` | Get full schema metadata (models, fields, enums) |

**Response:**

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "id", "type": "number", "isId": true, "isRequired": true, ... },
        { "name": "email", "type": "string", "isUnique": true, ... }
      ]
    }
  ],
  "enums": [
    { "name": "Role", "values": ["ADMIN", "USER"] }
  ]
}
```

### CRUD

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/:model` | List records (paginated) |
| `GET` | `/api/:model/:id` | Get single record |
| `POST` | `/api/:model` | Create record |
| `PUT` | `/api/:model/:id` | Update record |
| `DELETE` | `/api/:model/:id` | Delete record |

The `:model` parameter is the Prisma model name (e.g., `User`, `BlogPost`).

### Stats

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stats` | Per-model record counts with recent 24h activity |

### Bulk Operations

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/api/:model/bulk` | Delete multiple records. Body: `{ ids: [1,2,3] }` |
| `PUT` | `/api/:model/bulk` | Update multiple records. Body: `{ ids: [1,2,3], data: {...} }` |

### Audit Log

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/audit` | All audit entries (paginated) |
| `GET` | `/api/audit/:model` | Audit entries for a specific model |
| `GET` | `/api/audit/:model/:id` | Audit entries for a specific record |

#### Query Parameters for List Endpoint

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Records per page (max 100) |
| `sort` | string | -- | Field name to sort by |
| `order` | `asc` \| `desc` | `asc` | Sort direction |
| `search` | string | -- | Full-text search across string fields |
| `include` | string | -- | Comma-separated relation names to include |
| Any other | any | -- | Treated as a filter: `?status=active` filters by status |

Filter parameters support operators via double-underscore suffixes: `field__contains`, `field__gte`, `field__lte`, `field__gt`, `field__lt`, `field__in`, `field__not`, `field__null`. For example, `?name__contains=john&age__gte=18&role__in=admin,editor`.

#### List Response

```json
{
  "data": [
    { "id": 1, "email": "alice@example.com", "name": "Alice" }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Single Record Response

```json
{
  "data": { "id": 1, "email": "alice@example.com", "name": "Alice" }
}
```

#### Create Response (201)

```json
{
  "data": { "id": 2, "email": "bob@example.com", "name": "Bob" }
}
```

#### Delete Response

```json
{
  "success": true
}
```

#### Error Response

```json
{
  "error": "Record not found"
}
```

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/logout` | Logout and clear cookies |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `POST` | `/api/auth/refresh` | Refresh access token |

**Login request:**

```json
{
  "email": "admin",
  "password": "secret"
}
```

**Login response:**

```json
{
  "user": { "email": "admin", "role": "admin" },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

The server also sets `prada_token` and `prada_refresh` as HTTP-only cookies.

### Setup

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/setup/status` | Check if initial setup is needed |
| `POST` | `/api/setup/init` | Create initial admin credentials |

**Status response:**

```json
{ "configured": false }
```

**Init request:**

```json
{ "login": "admin", "password": "mysecret" }
```

**Init response:**

```json
{ "success": true, "message": "Credentials saved" }
```

---

## TypeScript Types

### Schema Types

```typescript
type FieldType =
  | 'string' | 'number' | 'boolean' | 'date'
  | 'bigint' | 'decimal' | 'json' | 'bytes'
  | 'enum' | 'relation'

interface Field {
  name: string
  type: FieldType
  isRequired: boolean
  isList: boolean
  isUnique: boolean
  isId: boolean
  isUpdatedAt: boolean
  hasDefaultValue: boolean
  default?: unknown
  documentation?: string
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  relationOnDelete?: string
  relatedModel?: string
  enumValues?: string[]
}

interface Model {
  name: string
  dbName?: string
  documentation?: string
  fields: Field[]
  primaryKey?: string[]
  uniqueFields?: string[][]
}

interface Enum {
  name: string
  values: string[]
  documentation?: string
}

interface Schema {
  models: Model[]
  enums: Enum[]
}
```

### API Types

```typescript
interface PaginationParams {
  page?: number
  limit?: number
}

interface SortParams {
  sort?: string
  order?: 'asc' | 'desc'
}

interface FilterParams {
  search?: string
  filters?: Record<string, unknown>
  include?: string
}

interface FindManyParams extends PaginationParams, SortParams, FilterParams {}

interface PaginatedResponse<T = unknown> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface RecordResponse<T = unknown> {
  data: T
}

type CrudAction = 'create' | 'read' | 'update' | 'delete'

interface FieldConfig {
  hidden?: boolean
  readonly?: boolean
  label?: string
}

interface ModelConfig {
  actions?: CrudAction[]
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  fields?: Record<string, FieldConfig>
}

interface ModelConfigs {
  [modelName: string]: ModelConfig
}
```

### Hook Types

```typescript
interface CrudHookContext {
  model: string
  schema: Schema
  prisma: PrismaClient
}

type BeforeCreateHook = (data: Record<string, unknown>, ctx: CrudHookContext) => Promise<Record<string, unknown>> | Record<string, unknown>
type AfterCreateHook = (record: Record<string, unknown>, ctx: CrudHookContext) => Promise<void> | void
type BeforeUpdateHook = (id: string | number, data: Record<string, unknown>, ctx: CrudHookContext) => Promise<Record<string, unknown>> | Record<string, unknown>
type AfterUpdateHook = (record: Record<string, unknown>, ctx: CrudHookContext) => Promise<void> | void
type BeforeDeleteHook = (id: string | number, ctx: CrudHookContext) => Promise<void> | void
type AfterDeleteHook = (id: string | number, ctx: CrudHookContext) => Promise<void> | void
type BeforeFindHook = (query: FindManyParams, ctx: CrudHookContext) => Promise<FindManyParams> | FindManyParams
type AfterFindHook = (records: Record<string, unknown>[], ctx: CrudHookContext) => Promise<Record<string, unknown>[]> | Record<string, unknown>[]

interface ModelHooks {
  beforeCreate?: BeforeCreateHook
  afterCreate?: AfterCreateHook
  beforeUpdate?: BeforeUpdateHook
  afterUpdate?: AfterUpdateHook
  beforeDelete?: BeforeDeleteHook
  afterDelete?: AfterDeleteHook
  beforeFind?: BeforeFindHook
  afterFind?: AfterFindHook
}

interface CrudHooks {
  '*'?: ModelHooks              // Global hooks (all models)
  [modelName: string]: ModelHooks | undefined   // Per-model hooks
}
```

### Auth Types

```typescript
interface User {
  email?: string
  login?: string
  role: string
}

interface JwtPayload {
  email?: string
  login?: string
  role: string
  type?: 'refresh'
  iat?: number
  exp?: number
}

interface AuthConfig {
  email?: string
  login?: string
  password?: string
  passwordHash?: string
  salt?: string
  jwtSecret?: string
  jwtExpiresIn?: string       // default: '1h'
  refreshExpiresIn?: string   // default: '7d'
  disabled?: boolean
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthService {
  validateCredentials: (login: string, password: string) => Promise<User | null> | User | null | boolean
  generateTokens: (user: User) => AuthTokens
  generateAccessToken: (user: User) => string
  verifyToken: (token: string) => JwtPayload | null
}
```

### Server Types

```typescript
interface PradaServerOptions {
  prisma: PrismaClient
  schemaPath?: string
  models?: ModelConfigs
  hooks?: CrudHooks
  auth?: {
    login?: string
    password?: string
    disabled?: boolean
  }
  staticPath?: string
  cwd?: string
  modules?: PradaModule[]
  audit?: boolean | AuditOptions
}

interface PradaContext {
  prisma: PrismaClient
  schema: Schema
  router: Router
  authMiddleware: RequestHandler
  config: { cwd: string }
}

interface PradaModule {
  name: string
  routes?: (ctx: PradaContext) => void | Promise<void>
  middleware?: RequestHandler[]
}
```

### Audit Types

```typescript
interface AuditEntry {
  id: string
  model: string
  recordId: string | number
  action: 'create' | 'update' | 'delete'
  changes: AuditChange[]
  timestamp: Date
  user?: string
}

interface AuditChange {
  field: string
  oldValue: unknown
  newValue: unknown
}
```

### UI Customization Types

```typescript
interface FieldComponentProps {
  name: string
  label: string
  field: PradaField
  model: PradaModel
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
  value?: unknown
  isEdit?: boolean
}

type FieldComponent = ComponentType<FieldComponentProps>

interface FieldOverrides {
  byType?: Record<string, FieldComponent>
  byName?: Record<string, FieldComponent>
  byModelField?: Record<string, Record<string, FieldComponent>>
}

interface CellRendererProps {
  value: unknown
  field: PradaField
  model: PradaModel
  row: Record<string, unknown>
}

type CellRenderer = ComponentType<CellRendererProps>

interface CellOverrides {
  byType?: Record<string, CellRenderer>
  byName?: Record<string, CellRenderer>
  byModelField?: Record<string, Record<string, CellRenderer>>
}

interface PageOverrides {
  dashboard?: ComponentType
  modelList?: ComponentType<{ model: PradaModel }>
  modelForm?: ComponentType<{ model: PradaModel; id?: string }>
  modelView?: ComponentType<{ model: PradaModel; id: string }>
  login?: ComponentType
}

interface SlotOverrides {
  sidebar?: ComponentType
  header?: ComponentType
  listHeader?: ComponentType<{ model: PradaModel }>
  listFooter?: ComponentType<{ model: PradaModel }>
  formHeader?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  formFooter?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  viewHeader?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  viewFooter?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
}

interface CustomRoute {
  path: string
  element: ComponentType
  sidebar?: {
    label: string
    icon?: ComponentType<{ size?: number }>
    section?: 'top' | 'bottom'
  }
}

interface SidebarOverrides {
  extraItems?: SidebarItem[]
  hiddenModels?: string[]
  modelLabels?: Record<string, string>
  logo?: ComponentType
}

interface ActionOverrides {
  rowActions?: Record<string, ComponentType<{ row: Record<string, unknown>; model: PradaModel }>[]>
  hideActions?: Record<string, ('view' | 'edit' | 'delete')[]>
}

interface PradaConfig {
  fields?: FieldOverrides
  cells?: CellOverrides
  pages?: PageOverrides
  slots?: SlotOverrides
  routes?: CustomRoute[]
  sidebar?: SidebarOverrides
  actions?: ActionOverrides
}
```

### UI Data Types

```typescript
interface PradaField {
  name: string
  type: string
  isRequired: boolean
  isList: boolean
  isUnique: boolean
  isId: boolean
  isUpdatedAt: boolean
  hasDefaultValue: boolean
  default?: unknown
  documentation?: string
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  relatedModel?: string
  enumValues?: string[]
}

interface PradaModel {
  name: string
  dbName?: string
  fields: PradaField[]
  primaryKey?: string[]
  uniqueFields?: string[][]
  documentation?: string
}

interface PradaSchema {
  models: PradaModel[]
  enums: PradaEnum[]
}

interface PradaEnum {
  name: string
  values: string[]
  documentation?: string
}

interface UseModelListParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  include?: string
  filters?: Record<string, unknown>
  enabled?: boolean
}
```
