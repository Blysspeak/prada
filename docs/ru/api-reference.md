# Справочник API

## Экспорт бэкенда (@blysspeak/prada)

### Уровень 3: Готовое решение

#### createPradaServer

Создает Express-роутер с полной функциональностью admin-панели.

```typescript
function createPradaServer(options: PradaServerOptions): Promise<Router>
```

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
  audit?: boolean | AuditOptions
  staticPath?: string
  cwd?: string
  modules?: PradaModule[]
}
```

### Уровень 2: Строительные блоки

#### Маршруты

```typescript
// CRUD-маршруты для всех моделей
function createCrudRoutes(apiHandler: ApiHandler): Router

// Маршруты аутентификации (login, logout, me, refresh)
function createAuthRoutes(authService: AuthService): Router

// Маршруты первоначальной настройки (status, init)
function createSetupRoutes(cwd?: string): Router
```

#### Middleware

```typescript
// Middleware проверки JWT (обязательный)
function createAuthMiddleware(authService: AuthService): RequestHandler

// Middleware проверки JWT (опциональный -- не блокирует, если токена нет)
function createOptionalAuthMiddleware(authService: AuthService): RequestHandler
```

#### Фабрики

```typescript
// Создание обработчика CRUD-операций
function createApiHandler(
  prisma: PrismaClient,
  schema: Schema,
  options?: ApiHandlerOptions
): ApiHandler

// Создание сервиса аутентификации из параметров
function createAuthService(config: {
  login?: string
  password?: string
  disabled?: boolean
}): AuthService

// Создание сервиса аутентификации из файла конфигурации
function createAuthServiceFromConfig(config: LoadedConfig): AuthService
```

#### Парсинг схемы

```typescript
// Парсинг файла или директории .prisma
function parseSchema(schemaPath?: string): Promise<Schema>

// Парсинг строки с содержимым схемы
function parseDMMF(schemaContent: string): Promise<Schema>
```

#### Конфигурация

```typescript
// Загрузка конфигурации из файла и переменных окружения
function loadConfig(cwd?: string): LoadedConfig

// Проверка, настроена ли система
function isConfigured(cwd?: string): boolean

// Сохранение учетных данных в файл
function saveCredentials(login: string, password: string, cwd?: string): void

// Удаление файла учетных данных
function deleteCredentials(cwd?: string): void
```

#### Раздача UI

```typescript
// Определение пути к собранным файлам UI
function resolveUIPath(): Promise<string>

// Middleware для раздачи статических файлов UI
function serveUI(staticPath: string): RequestHandler

// SPA-fallback (отдает index.html для всех не-API маршрутов)
function createSpaHandler(staticPath: string): RequestHandler

// Проверка наличия файлов UI
function uiFilesExist(): Promise<boolean>
```

### Уровень 1: Примитивы

#### Утилиты схемы

```typescript
function getModelByName(schema: Schema, name: string): Model | undefined
function getModels(schema: Schema): Record<string, Model>
function getEnums(schema: Schema): Record<string, Enum>
function getScalarFields(model: Model): Field[]
function getRelationFields(model: Model): Field[]
function getIdField(model: Model): Field | undefined
function getSearchableFields(model: Model): Field[]
function getRequiredFields(model: Model): Field[]
function getRelations(schema: Schema): Array<{
  name: string; from: string; to: string; fromField: string; toField: string
}>
```

#### Построение запросов

```typescript
// WHERE-условие из поиска и фильтров
function buildWhereClause(
  model: Model,
  search?: string,
  filters?: Record<string, unknown>
): Record<string, unknown>

// ORDER BY из параметров сортировки
function buildOrderByClause(
  sort?: string,
  order?: 'asc' | 'desc',
  defaultSort?: { field: string; order: 'asc' | 'desc' }
): Record<string, 'asc' | 'desc'> | undefined

// INCLUDE из строки с названиями связей
function buildIncludeClause(
  model: Model,
  includeParam?: string
): Record<string, boolean> | undefined

// SELECT на основе скрытых полей
function buildSelectClause(
  model: Model,
  fieldsConfig?: Record<string, { hidden?: boolean }>
): Record<string, boolean> | undefined

// Пагинация с лимитами
function parsePagination(
  page?: number,
  limit?: number,
  maxLimit?: number
): { skip: number; take: number; page: number; limit: number }
```

#### Валидация и конвертация

```typescript
// Конвертация значения в тип поля
function convertFieldValue(value: unknown, field: Field): unknown

// Очистка входных данных по схеме модели
function sanitizeInput(data: Record<string, unknown>, model: Model): Record<string, unknown>

// Проверка обязательных полей
function validateRequired(data: Record<string, unknown>, model: Model): string[]

// Полная валидация входных данных
function validateInput(data: Record<string, unknown>, model: Model): { valid: boolean; errors: string[] }

// Парсинг ID (строка в число, если нужно)
function parseId(id: string, model: Model): string | number
```

#### CRUD-операции (фабрики)

```typescript
function createFindMany(ctx: OperationContext): (model: string, params: FindManyParams) => Promise<PaginatedResponse>
function createFindOne(ctx: OperationContext): (model: string, id: string | number, include?: string) => Promise<Record<string, unknown> | null>
function createCreate(ctx: OperationContext): (model: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
function createUpdate(ctx: OperationContext): (model: string, id: string | number, data: Record<string, unknown>) => Promise<Record<string, unknown>>
function createDelete(ctx: OperationContext): (model: string, id: string | number) => Promise<Record<string, unknown>>
function createBulkDelete(ctx: OperationContext): (model: string, ids: (string | number)[]) => Promise<{ count: number }>
function createBulkUpdate(ctx: OperationContext): (model: string, ids: (string | number)[], data: Record<string, unknown>) => Promise<{ count: number }>
```

- `createBulkDelete(ctx)` -- Массовое удаление записей
- `createBulkUpdate(ctx)` -- Массовое обновление записей

#### JWT-утилиты

```typescript
function generateToken(payload: object, secret: string, expiresIn?: string): string
function generateRefreshToken(payload: object, secret: string, expiresIn?: string): string
function generateTokens(user: User, secret: string): AuthTokens
function verifyToken(token: string, secret: string): JwtPayload | null
function decodeToken(token: string): JwtPayload | null
function isTokenExpired(token: string): boolean
```

#### Утилиты паролей

```typescript
function hashPassword(password: string): { hash: string; salt: string }
function verifyPassword(password: string, hash: string, salt: string): boolean
function comparePassword(password: string, hash: string): Promise<boolean>
function hashPasswordBcrypt(password: string): Promise<string>
```

#### Аудит

```typescript
// Создание хранилища аудита (in-memory кольцевой буфер)
function createAuditStore(options?: { maxEntries?: number }): AuditStore

// CRUD-хуки для автоматического отслеживания изменений
function createAuditHooks(store: AuditStore): CrudHooks

// Express Router с эндпоинтами журнала аудита
function createAuditRoutes(store: AuditStore): Router
```

- `createAuditStore(options?)` -- Создание хранилища аудита. По умолчанию хранит до 1000 записей в кольцевом буфере.
- `createAuditHooks(store)` -- Возвращает хуки, которые автоматически записывают все CRUD-операции (создание, обновление, удаление) в хранилище аудита.
- `createAuditRoutes(store)` -- Express Router с эндпоинтами для чтения журнала аудита (см. раздел REST API).

---

## Экспорт UI (@blysspeak/prada-ui)

### Главный компонент

```typescript
function App(props: AppProps): JSX.Element

interface AppProps {
  config?: PradaConfig
}
```

### Система кастомизации

```typescript
// Провайдер конфигурации
function PradaProvider(props: { config: PradaConfig; children: ReactNode }): JSX.Element

// Хук доступа к конфигурации
function usePrada(): PradaConfig

// Хук разрешения компонента поля
function useFieldComponent(modelName: string, fieldName: string, fieldType: string): FieldComponent

// Хук разрешения рендерера ячейки
function useCellRenderer(modelName: string, fieldName: string, fieldType: string): CellRenderer
```

### Хуки данных

```typescript
function useModelList<T>(modelName: string, params?: UseModelListParams): { data: T[]; meta: PaginationMeta; isLoading: boolean; error: Error | null; refetch: () => void; isFetching: boolean }
function useModelRecord<T>(modelName: string, id: string | number | undefined, options?: { include?: string; enabled?: boolean }): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => void }
function useModelCreate<T>(modelName: string): { mutate: (data: Record<string, unknown>) => void; mutateAsync: (data: Record<string, unknown>) => Promise<{ data: T }>; data: T | null; isLoading: boolean; error: Error | null; reset: () => void }
function useModelUpdate<T>(modelName: string): { mutate: (args: { id: string | number; data: Record<string, unknown> }) => void; mutateAsync: (args: { id: string | number; data: Record<string, unknown> }) => Promise<{ data: T }>; data: T | null; isLoading: boolean; error: Error | null; reset: () => void }
function useModelDelete(modelName: string): { mutate: (id: string | number) => void; mutateAsync: (id: string | number) => Promise<void>; isLoading: boolean; error: Error | null; reset: () => void }
```

### Страницы

```typescript
function LoginPage(): JSX.Element
function SetupPage(): JSX.Element
function DashboardPage(): JSX.Element
function ModelListPage(): JSX.Element
function ModelFormPage(): JSX.Element
function ModelViewPage(): JSX.Element
```

### Компоненты

```typescript
// Таблица данных
function DataTable(props: DataTableProps): JSX.Element
function Pagination(props: PaginationProps): JSX.Element
function CellValue(props: CellValueProps): JSX.Element

// Формы
function DynamicForm(props: DynamicFormProps): JSX.Element
function FieldRenderer(props: FieldRendererProps): JSX.Element

// Layout
function Layout(): JSX.Element
function Sidebar(): JSX.Element

// Настройки
function SettingsModal(): JSX.Element
function AnimatedThemeToggler(): JSX.Element

// UI-примитивы
function BorderBeam(props: BorderBeamProps): JSX.Element
function MorphingText(props: MorphingTextProps): JSX.Element
```

### Дополнительные хуки

```typescript
// Горячие клавиши
function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void

// Конфигурация колонок (видимость, порядок, ширина)
function useColumnConfig(modelName: string): {
  columns: ColumnConfig[]
  toggleColumn: (name: string) => void
  reorderColumns: (from: number, to: number) => void
  resetColumns: () => void
}

// Глобальный поиск (Ctrl+K)
function useGlobalSearch(): {
  query: string
  setQuery: (q: string) => void
  results: SearchResult[]
  isOpen: boolean
  open: () => void
  close: () => void
}

// Автокомплит для FK-полей
function useRelationOptions(modelName: string, options?: { search?: string; limit?: number }): {
  options: { label: string; value: string | number }[]
  isLoading: boolean
}
```

### Дополнительные компоненты

```typescript
// Панель фильтров
function Filters(props: FiltersProps): JSX.Element

// Глобальный поиск (Ctrl+K)
function GlobalSearch(): JSX.Element

// Виджеты дашборда
function DashboardWidgets(): JSX.Element

// Отображение журнала аудита
function AuditLog(props: AuditLogProps): JSX.Element
function AuditDiff(props: AuditDiffProps): JSX.Element

// Справка по горячим клавишам
function KeyboardShortcutsHelp(): JSX.Element
```

### Компоненты полей

```typescript
function TextField(props: FieldComponentProps): JSX.Element
function NumberField(props: FieldComponentProps): JSX.Element
function BooleanField(props: FieldComponentProps): JSX.Element
function DateTimeField(props: FieldComponentProps): JSX.Element
function EnumField(props: FieldComponentProps): JSX.Element
function JsonField(props: FieldComponentProps): JSX.Element
```

### Провайдеры

```typescript
function AuthProvider(props: { children: ReactNode }): JSX.Element
function useAuth(): AuthState & { login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> }

function SchemaProvider(props: { children: ReactNode }): JSX.Element
function useSchema(): { schema: PradaSchema | null; isLoading: boolean }

function SettingsProvider(props: { children: ReactNode }): JSX.Element
function useSettings(): Settings & { setTheme: (t: Theme) => void; setLanguage: (l: Language) => void; setDateFormat: (f: DateFormat) => void }

function SetupProvider(props: { children: ReactNode }): JSX.Element
function useSetup(): { isConfigured: boolean; isLoading: boolean; setup: (login: string, password: string) => Promise<void> }
```

### Интернационализация

```typescript
function useTranslation(): (key: TranslationKey) => string
function pluralize(count: number, one: string, few: string, many: string): string
function formatDate(date: string | Date, format: DateFormat, language: Language): string
```

### Утилиты

```typescript
// HTTP-клиент
const api: {
  auth: { login, logout, me, refresh }
  schema: { get }
  model: { list, get, create, update, delete }
}

// CSS-классы (tailwind-merge + clsx)
function cn(...classes: ClassValue[]): string
```

---

## REST API эндпоинты

Все эндпоинты монтируются относительно базового пути (например, `/admin`).

### Настройка (setup)

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| GET | `/api/setup/status` | Проверка, настроена ли система | Нет |
| POST | `/api/setup/init` | Первоначальная настройка учетных данных | Нет |

**POST /api/setup/init** -- тело запроса:

```json
{
  "login": "admin",
  "password": "secret123"
}
```

Ответ:

```json
{
  "success": true,
  "message": "Credentials saved"
}
```

### Аутентификация (auth)

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| POST | `/api/auth/login` | Вход в систему | Нет |
| POST | `/api/auth/logout` | Выход из системы | Нет |
| GET | `/api/auth/me` | Получить текущего пользователя | Да |
| POST | `/api/auth/refresh` | Обновить access token | Нет (использует refresh cookie) |

**POST /api/auth/login** -- тело запроса:

```json
{
  "email": "admin",
  "password": "secret123"
}
```

Ответ:

```json
{
  "user": { "email": "admin", "role": "admin" },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Устанавливает HTTP-only cookies:
- `prada_token` -- access token (1 час)
- `prada_refresh` -- refresh token (7 дней)

**GET /api/auth/me** -- ответ:

```json
{
  "user": { "email": "admin", "role": "admin" }
}
```

### Схема

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| GET | `/api/schema` | Получить метаданные схемы | Да |

Ответ:

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        {
          "name": "id",
          "type": "number",
          "isRequired": true,
          "isId": true,
          "hasDefaultValue": true,
          "isList": false,
          "isUnique": true,
          "isUpdatedAt": false
        },
        {
          "name": "email",
          "type": "string",
          "isRequired": true,
          "isId": false,
          "hasDefaultValue": false,
          "isList": false,
          "isUnique": true,
          "isUpdatedAt": false
        }
      ]
    }
  ],
  "enums": [
    {
      "name": "Role",
      "values": ["ADMIN", "USER"]
    }
  ]
}
```

### Статистика

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| GET | `/api/stats` | Количество записей по моделям с активностью за 24 часа | Да |

Ответ:

```json
{
  "models": {
    "User": { "count": 42, "recent": 3 },
    "Post": { "count": 128, "recent": 12 }
  }
}
```

### Массовые операции

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| DELETE | `/api/:model/bulk` | Массовое удаление записей | Да |
| PUT | `/api/:model/bulk` | Массовое обновление записей | Да |

**DELETE /api/:model/bulk** -- тело запроса:

```json
{ "ids": [1, 2, 3] }
```

**PUT /api/:model/bulk** -- тело запроса:

```json
{ "ids": [1, 2, 3], "data": { "status": "archived" } }
```

### Аудит

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| GET | `/api/audit` | Все записи журнала аудита | Да |
| GET | `/api/audit/:model` | Записи аудита по модели | Да |
| GET | `/api/audit/:model/:id` | Записи аудита по конкретной записи | Да |

Ответ:

```json
{
  "entries": [
    {
      "id": "uuid",
      "action": "update",
      "model": "User",
      "recordId": 5,
      "changes": [
        { "field": "name", "before": "John", "after": "Johnny" }
      ],
      "timestamp": "2026-03-08T12:00:00.000Z",
      "user": "admin"
    }
  ]
}
```

### CRUD-операции

Все CRUD-эндпоинты требуют авторизации.

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/:model` | Список записей (пагинация) |
| GET | `/api/:model/:id` | Одна запись по ID |
| POST | `/api/:model` | Создать запись |
| PUT | `/api/:model/:id` | Обновить запись |
| DELETE | `/api/:model/:id` | Удалить запись |

Имя модели в URL регистронезависимое: `/api/User`, `/api/user`, `/api/USER` -- эквивалентны.

#### GET /api/:model -- параметры запроса

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `page` | number | 1 | Номер страницы |
| `limit` | number | 20 | Записей на странице (максимум 100) |
| `sort` | string | -- | Поле для сортировки |
| `order` | `asc` \| `desc` | `asc` | Направление сортировки |
| `search` | string | -- | Поиск по строковым полям (case-insensitive, contains) |
| `include` | string | -- | Связи для включения (через запятую: `posts,comments`) |
| `[field]` | any | -- | Фильтр по значению поля (например, `?status=active`) |
| `[field]__contains` | string | -- | Содержит подстроку (например, `?name__contains=john`) |
| `[field]__gte` | any | -- | Больше или равно |
| `[field]__lte` | any | -- | Меньше или равно |
| `[field]__gt` | any | -- | Строго больше |
| `[field]__lt` | any | -- | Строго меньше |
| `[field]__in` | string | -- | Входит в список (через запятую: `?role__in=admin,editor`) |
| `[field]__not` | any | -- | Не равно |
| `[field]__null` | boolean | -- | Равно null (`true`) или не null (`false`) |

Пример:

```
GET /api/User?page=2&limit=10&sort=createdAt&order=desc&search=john&role=admin&include=posts
```

Ответ:

```json
{
  "data": [
    { "id": 1, "name": "John", "email": "john@example.com", "role": "admin", "posts": [...] }
  ],
  "meta": {
    "total": 42,
    "page": 2,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### GET /api/:model/:id

Параметры:

| Параметр | Тип | Описание |
|---|---|---|
| `include` | string | Связи для включения (через запятую) |

Ответ:

```json
{
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@example.com"
  }
}
```

Ошибка 404:

```json
{
  "error": "Record not found"
}
```

#### POST /api/:model

Тело запроса -- JSON с полями записи:

```json
{
  "name": "John",
  "email": "john@example.com",
  "role": "USER"
}
```

Ответ (201):

```json
{
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

#### PUT /api/:model/:id

Тело запроса -- JSON с обновляемыми полями:

```json
{
  "name": "John Updated"
}
```

Ответ:

```json
{
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john@example.com"
  }
}
```

#### DELETE /api/:model/:id

Ответ:

```json
{
  "success": true
}
```

---

## Типы TypeScript

### Типы схемы

```typescript
type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'bigint' | 'decimal' | 'json' | 'bytes' | 'enum' | 'relation'

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

interface ModelMap {
  [modelName: string]: Model
}
```

### Типы API

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
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
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

interface ApiHandler {
  findMany: (model: string, params?: FindManyParams) => Promise<PaginatedResponse>
  findOne: (model: string, id: string | number, include?: string) => Promise<Record<string, unknown> | null>
  create: (model: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (model: string, id: string | number, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  remove: (model: string, id: string | number) => Promise<Record<string, unknown>>
  getSchema: () => Schema
}

interface ApiHandlerOptions {
  models?: ModelConfigs
  hooks?: CrudHooks
}
```

### Типы хуков

```typescript
interface CrudHookContext {
  model: string
  schema: Schema
  prisma: PrismaClient
}

type BeforeCreateHook = (data: Record<string, unknown>, context: CrudHookContext) => Promise<Record<string, unknown>> | Record<string, unknown>
type AfterCreateHook = (record: Record<string, unknown>, context: CrudHookContext) => Promise<void> | void
type BeforeUpdateHook = (id: string | number, data: Record<string, unknown>, context: CrudHookContext) => Promise<Record<string, unknown>> | Record<string, unknown>
type AfterUpdateHook = (record: Record<string, unknown>, context: CrudHookContext) => Promise<void> | void
type BeforeDeleteHook = (id: string | number, context: CrudHookContext) => Promise<void> | void
type AfterDeleteHook = (id: string | number, context: CrudHookContext) => Promise<void> | void
type BeforeFindHook = (query: FindManyParams, context: CrudHookContext) => Promise<FindManyParams> | FindManyParams
type AfterFindHook = (records: Record<string, unknown>[], context: CrudHookContext) => Promise<Record<string, unknown>[]> | Record<string, unknown>[]

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
  '*'?: ModelHooks
  [modelName: string]: ModelHooks | undefined
}
```

### Типы аутентификации

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
  jwtExpiresIn?: string
  refreshExpiresIn?: string
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

interface CredentialsConfig {
  login: string
  passwordHash: string
  salt: string
  secret: string
  createdAt: string
}

interface LoadedConfig {
  auth: {
    login?: string
    password?: string
    passwordHash?: string
    salt?: string
    secret?: string
    fromEnv?: boolean
    fromFile?: boolean
  } | null
}
```

### Типы сервера

```typescript
interface PradaServerOptions {
  prisma: PrismaClient
  schemaPath?: string
  models?: ModelConfigs
  hooks?: CrudHooks
  auth?: { login?: string; password?: string; disabled?: boolean }
  staticPath?: string
  cwd?: string
  modules?: PradaModule[]
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

interface AuditOptions {
  /** Максимальное количество записей в буфере (по умолчанию 1000) */
  maxEntries?: number
}

interface AuditEntry {
  id: string
  action: 'create' | 'update' | 'delete'
  model: string
  recordId: string | number
  changes: AuditChange[]
  timestamp: string
  user?: string
}

interface AuditChange {
  field: string
  before?: unknown
  after?: unknown
}
```

### Типы кастомизации UI

```typescript
interface PradaConfig {
  fields?: FieldOverrides
  cells?: CellOverrides
  pages?: PageOverrides
  slots?: SlotOverrides
  routes?: CustomRoute[]
  sidebar?: SidebarOverrides
  actions?: ActionOverrides
}

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
  listHeader?: ComponentType<{ model: PradaModel }>
  listFooter?: ComponentType<{ model: PradaModel }>
  formHeader?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  formFooter?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  viewHeader?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  viewFooter?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  header?: ComponentType
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

interface SidebarItem {
  label: string
  path: string
  icon?: ComponentType<{ size?: number }>
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
```

### Типы UI-схемы

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

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

type Theme = 'light' | 'dark'
type Language = 'en' | 'ru'
type DateFormat = string

interface Settings {
  theme: Theme
  language: Language
  dateFormat: DateFormat
}
```
