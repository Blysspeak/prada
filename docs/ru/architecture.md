# Архитектура

## Три уровня абстракции

PRADA построена по принципу трехуровневой абстракции. Каждый уровень подходит для разных задач: от быстрого запуска до полного контроля над каждым компонентом.

### Уровень 3: Готовое решение

Функция `createPradaServer()` -- это точка входа, которая собирает всю функциональность в один Express-роутер. Подходит для типичных сценариев использования.

```typescript
import { createPradaServer } from '@blysspeak/prada'

app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' },
  schemaPath: './prisma/schema',
  modules: [statsModule],
  audit: true,
  hooks: {
    User: {
      beforeCreate: async (data) => ({ ...data, role: 'user' })
    }
  }
}))
```

Что делает `createPradaServer` внутри:

1. Подключает middleware: `cors`, `json()`, `cookie-parser`
2. Применяет глобальный middleware из модулей
3. Парсит Prisma-схему (файл или директория)
4. Создает API-обработчик с хуками
5. Монтирует маршруты: setup, auth, CRUD
6. Инициализирует модули
7. Раздает статические файлы UI
8. Настраивает SPA-fallback

### Уровень 2: Строительные блоки

Отдельные фабрики для каждого компонента. Используйте этот уровень, когда нужна нестандартная конфигурация или интеграция с существующим сервером.

```typescript
import {
  parseSchema,
  createApiHandler,
  createAuthService,
  createAuthMiddleware,
  createCrudRoutes,
  createAuthRoutes,
  createSetupRoutes
} from '@blysspeak/prada'

// Парсинг схемы
const schema = await parseSchema('./prisma/schema.prisma')

// Создание API-обработчика
const api = createApiHandler(prisma, schema, {
  hooks: {
    '*': { beforeCreate: async (data) => ({ ...data, createdAt: new Date() }) }
  },
  models: {
    User: { actions: ['read'], fields: { password: { hidden: true } } }
  }
})

// Создание сервиса аутентификации
const auth = createAuthService({ login: 'admin', password: 'secret' })

// Сборка маршрутов
const router = Router()
router.use('/api/setup', createSetupRoutes())
router.use('/api/auth', createAuthRoutes(auth))
router.use('/api', createAuthMiddleware(auth), createCrudRoutes(api))

app.use('/admin', router)
```

### Уровень 1: Примитивы

Низкоуровневые утилиты для построения собственной логики. Подходят, когда нужен полный контроль.

```typescript
import {
  buildWhereClause,
  buildOrderByClause,
  buildIncludeClause,
  parsePagination,
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  getModelByName,
  getScalarFields,
  getRelationFields,
  getIdField
} from '@blysspeak/prada'

// Построение запроса
const model = getModelByName(schema, 'User')
const where = buildWhereClause(model, 'john', { role: 'admin' })
const orderBy = buildOrderByClause('createdAt', 'desc')
const include = buildIncludeClause(model, 'posts,comments')
const { skip, take } = parsePagination(2, 50)

// Работа с JWT
const token = generateToken({ email: 'admin', role: 'admin' }, 'secret')
const payload = verifyToken(token, 'secret')

// Работа с паролями
const { hash, salt } = hashPassword('my-password')
const isValid = verifyPassword('my-password', hash, salt)
```

## Структура проекта

```
prada/
├── src/                          # Бэкенд (@blysspeak/prada)
│   ├── index.ts                  # Главный экспорт (все 3 уровня)
│   ├── server.ts                 # createPradaServer (Level 3)
│   ├── types.ts                  # Реэкспорт публичных типов
│   ├── api/
│   │   ├── handler.ts            # createApiHandler (Level 2)
│   │   ├── routes.ts             # createCrudRoutes (Level 2)
│   │   ├── query-builder.ts      # Построение Prisma-запросов (Level 1)
│   │   ├── sanitizer.ts          # Валидация и конвертация данных (Level 1)
│   │   ├── types.ts              # Типы API (хуки, конфиги, параметры)
│   │   └── operations/
│   │       ├── findMany.ts       # Операция получения списка
│   │       ├── findOne.ts        # Операция получения одной записи
│   │       ├── create.ts         # Операция создания
│   │       ├── update.ts         # Операция обновления
│   │       ├── delete.ts         # Операция удаления
│   │       ├── bulkDelete.ts     # Массовое удаление
│   │       ├── bulkUpdate.ts     # Массовое обновление
│   │       └── stats.ts          # Статистика по моделям
│   ├── audit/
│   │   ├── types.ts              # Типы записей аудита
│   │   ├── store.ts              # In-memory кольцевой буфер
│   │   ├── hooks.ts              # Автоматические хуки отслеживания
│   │   ├── routes.ts             # REST-эндпоинты журнала аудита
│   │   └── index.ts              # Barrel-экспорт
│   ├── auth/
│   │   ├── service.ts            # createAuthService (Level 2)
│   │   ├── middleware.ts         # createAuthMiddleware (Level 2)
│   │   ├── routes.ts             # createAuthRoutes (Level 2)
│   │   ├── setup.ts              # createSetupRoutes (Level 2)
│   │   ├── config.ts             # Работа с файлом конфигурации
│   │   ├── jwt.ts                # JWT-утилиты (Level 1)
│   │   ├── password.ts           # Хеширование паролей (Level 1)
│   │   └── types.ts              # Типы аутентификации
│   ├── schema/
│   │   ├── parser.ts             # parseSchema, parseDMMF (Level 2)
│   │   ├── index.ts              # Утилиты для работы со схемой (Level 1)
│   │   └── types.ts              # Типы схемы (Model, Field, Schema)
│   └── ui/
│       └── serve.ts              # Раздача статических файлов UI
│
├── packages/
│   └── ui/                       # React UI (@blysspeak/prada-ui)
│       └── src/
│           ├── App.tsx           # Главный компонент (принимает PradaConfig)
│           ├── index.ts          # Экспорт компонентов, хуков, типов
│           ├── api.ts            # HTTP-клиент для API
│           ├── types.ts          # UI-типы (PradaField, PradaModel, etc.)
│           ├── customization/    # Система кастомизации (PradaConfig)
│           ├── hooks/            # Data hooks (useModelList, etc.)
│           │   ├── useKeyboardShortcuts.ts  # Горячие клавиши
│           │   ├── useColumnConfig.ts       # Конфигурация колонок
│           │   ├── useGlobalSearch.ts       # Глобальный поиск
│           │   └── useRelationOptions.ts    # Автокомплит для FK
│           ├── components/       # React-компоненты
│           │   ├── Filters/                 # Панель фильтров
│           │   ├── Search/                  # Глобальный поиск (Ctrl+K)
│           │   ├── Dashboard/               # Виджеты дашборда
│           │   ├── Audit/                   # Отображение изменений
│           │   └── KeyboardShortcuts/       # Справка по горячим клавишам
│           ├── pages/            # Страницы (Dashboard, List, Form, View)
│           ├── providers/        # React-контексты (Auth, Schema, Settings)
│           └── i18n/             # Интернационализация (ru/en)
│
├── package.json                  # Основной package.json
├── pnpm-workspace.yaml           # Конфигурация pnpm monorepo
├── tsconfig.json                 # TypeScript конфигурация
└── tsup.config.ts                # Конфигурация сборки бэкенда
```

## Зависимости между пакетами

```
@blysspeak/prada (бэкенд)
├── express, cors, cookie-parser   # HTTP
├── jsonwebtoken, bcrypt           # Аутентификация
├── @prisma/internals              # Парсинг схемы
└── @prisma/client (peer)          # ORM

@blysspeak/prada-ui (фронтенд)
├── react, react-dom               # UI framework
├── react-router-dom               # Маршрутизация
├── @tanstack/react-query          # Data fetching
├── react-hook-form                # Формы
└── tailwindcss                    # Стили
```

Бэкенд-пакет самостоятелен и не зависит от UI-пакета. UI-пакет собирается отдельно и раздается как статические файлы.

## Поток данных

### Инициализация

```
Prisma-схема (.prisma файлы)
    |
    v
parseSchema() --- @prisma/internals (getDMMF)
    |
    v
Schema { models: Model[], enums: Enum[] }
    |
    v
createApiHandler(prisma, schema, options)
    |
    v
ApiHandler { findMany, findOne, create, update, remove, getSchema }
    |
    v
createCrudRoutes(apiHandler)
    |
    v
Express Router (GET/POST/PUT/DELETE /:model)
```

### Обработка запроса (CRUD)

```
HTTP Request (GET /api/User?page=1&sort=name&search=john)
    |
    v
Auth Middleware --- проверка JWT из cookie/header
    |
    v
CRUD Route --- парсинг query params
    |
    v
ApiHandler.findMany('User', { page: 1, sort: 'name', search: 'john' })
    |
    v
Hooks: beforeFind --- модификация запроса
    |
    v
Query Builder:
  - buildWhereClause(model, search, filters)
  - buildOrderByClause(sort, order)
  - buildIncludeClause(model, include)
  - parsePagination(page, limit)
    |
    v
Prisma Client --- выполнение запроса к PostgreSQL
    |
    v
Hooks: afterFind --- постобработка результата
    |
    v
PaginatedResponse { data: [...], meta: { total, page, limit, totalPages } }
```

## Парсинг схемы

PRADA поддерживает два формата Prisma-схемы:

### Один файл

```
prisma/
└── schema.prisma
```

### Директория с файлами

```
prisma/
└── schema/
    ├── base.prisma       # datasource, generator
    ├── user.prisma       # model User
    ├── post.prisma       # model Post
    └── enums.prisma      # enum Role, enum Status
```

Файлы в директории читаются в алфавитном порядке и конкатенируются. Убедитесь, что блок `datasource` и `generator` находятся в файле, который идет первым по алфавиту (например, `_base.prisma` или `00-base.prisma`).

Парсинг выполняется через `@prisma/internals` (функция `getDMMF`). Результат -- объект `Schema` со списком моделей и enum-типов. Типы полей Prisma транслируются в упрощенные JavaScript-типы:

| Prisma | PRADA |
|---|---|
| String | `string` |
| Int, Float | `number` |
| Boolean | `boolean` |
| DateTime | `date` |
| BigInt | `bigint` |
| Decimal | `decimal` |
| Json | `json` |
| Bytes | `bytes` |
| Enum | `enum` |
| Model (relation) | `relation` |

Для полей типа `relation` дополнительно устанавливается свойство `relatedModel?: string` -- имя связанной модели.

## Аутентификация

### Общая схема

```
Первый запуск (без учетных данных)
    |
    v
Setup Wizard --- POST /api/setup/init { login, password }
    |
    v
Сохранение в .prada/credentials (SHA256 + salt)
    |
    v
Login --- POST /api/auth/login { email, password }
    |
    v
Проверка пароля (bcrypt или SHA256)
    |
    v
Генерация JWT:
  - Access Token (1 час, cookie: prada_token)
  - Refresh Token (7 дней, cookie: prada_refresh)
    |
    v
Защищенные маршруты:
  - Проверка prada_token из cookie
  - Или из заголовка Authorization: Bearer <token>
    |
    v
Refresh --- POST /api/auth/refresh (использует prada_refresh cookie)
```

### Хранение учетных данных

Если учетные данные не переданы через код или переменные окружения, PRADA сохраняет их в файле `.prada/credentials` в формате JSON:

```json
{
  "login": "admin",
  "passwordHash": "sha256-хеш",
  "salt": "случайная-соль",
  "secret": "jwt-секрет",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Отключение аутентификации

Для разработки можно отключить аутентификацию:

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  auth: { disabled: true }
}))
```

## Конфигурация моделей

На уровне бэкенда можно настроить поведение CRUD-операций для каждой модели:

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  models: {
    User: {
      // Разрешить только чтение
      actions: ['read'],
      // Сортировка по умолчанию
      defaultSort: { field: 'createdAt', order: 'desc' },
      // Настройки полей
      fields: {
        password: { hidden: true },     // Не возвращать в ответах
        email: { readonly: true },       // Запретить изменение
        role: { label: 'User Role' }     // Кастомная метка для UI
      }
    }
  }
}))
```

## Система хуков

Хуки позволяют вмешиваться в процесс CRUD-операций. Они бывают глобальные (для всех моделей) и модель-специфичные:

```typescript
const hooks = {
  // Глобальные хуки (применяются ко всем моделям)
  '*': {
    beforeCreate: async (data, ctx) => {
      return { ...data, createdAt: new Date() }
    },
    afterDelete: async (id, ctx) => {
      console.log(`Deleted ${ctx.model}:${id}`)
    }
  },
  // Хуки для конкретной модели
  Order: {
    beforeCreate: async (data, ctx) => {
      return { ...data, orderNumber: generateOrderNumber() }
    },
    afterCreate: async (record, ctx) => {
      await sendNotification(record)
    }
  }
}
```

Порядок выполнения хуков:

1. Глобальный хук (`hooks['*'].beforeCreate`)
2. Модель-специфичный хук (`hooks['Order'].beforeCreate`)
3. Выполнение операции в базе данных
4. Глобальный хук (`hooks['*'].afterCreate`)
5. Модель-специфичный хук (`hooks['Order'].afterCreate`)
