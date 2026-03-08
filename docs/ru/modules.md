# Модули

## Обзор

Система модулей PRADA позволяет расширять функциональность бэкенда, добавляя собственные маршруты, middleware и логику. Модули подключаются через параметр `modules` в `createPradaServer`.

## Интерфейс PradaModule

```typescript
interface PradaModule {
  /** Имя модуля (для логирования и отладки) */
  name: string
  /** Регистрация кастомных маршрутов */
  routes?: (ctx: PradaContext) => void | Promise<void>
  /** Глобальный middleware (применяется ко всем маршрутам) */
  middleware?: RequestHandler[]
}
```

## Контекст модуля (PradaContext)

Каждый модуль получает контекст с доступом к основным ресурсам:

```typescript
interface PradaContext {
  /** Экземпляр Prisma Client */
  prisma: PrismaClient
  /** Разобранная схема базы данных */
  schema: Schema
  /** Express Router для монтирования маршрутов */
  router: Router
  /** Middleware аутентификации для защиты маршрутов */
  authMiddleware: RequestHandler
  /** Конфигурация */
  config: {
    cwd: string
  }
}
```

Через контекст модуль может:
- Выполнять запросы к базе данных через `prisma`
- Читать метаданные схемы через `schema`
- Добавлять маршруты на основной роутер через `router`
- Защищать свои маршруты через `authMiddleware`

## Создание модуля

### Минимальный модуль

```typescript
import type { PradaModule } from '@blysspeak/prada'

const helloModule: PradaModule = {
  name: 'hello',
  routes: (ctx) => {
    const { Router } = require('express')
    const router = Router()

    router.get('/hello', (req, res) => {
      res.json({ message: 'Hello from module!' })
    })

    // Монтируем под /api с авторизацией
    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

### Модуль с async-инициализацией

Функция `routes` может быть асинхронной:

```typescript
const migrationModule: PradaModule = {
  name: 'migration',
  routes: async (ctx) => {
    // Асинхронная инициализация
    await runPendingMigrations(ctx.prisma)

    const { Router } = require('express')
    const router = Router()

    router.get('/migration/status', async (req, res) => {
      const status = await getMigrationStatus(ctx.prisma)
      res.json(status)
    })

    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

## Регистрация модулей

Модули передаются в массиве `modules` при создании сервера:

```typescript
import { createPradaServer } from '@blysspeak/prada'

app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' },
  modules: [statsModule, uploadModule, exportModule]
}))
```

Порядок инициализации:

1. Глобальный middleware из всех модулей подключается первым
2. Основные маршруты PRADA (setup, auth, CRUD) монтируются
3. Функция `routes` каждого модуля вызывается последовательно, в порядке массива

## Модуль с кастомными маршрутами

### Маршруты с авторизацией

```typescript
import { Router } from 'express'
import type { PradaModule } from '@blysspeak/prada'

const statsModule: PradaModule = {
  name: 'stats',
  routes: (ctx) => {
    const router = Router()

    // Общая статистика по всем моделям
    router.get('/stats/overview', async (req, res) => {
      const counts: Record<string, number> = {}

      for (const model of ctx.schema.models) {
        const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
        try {
          counts[model.name] = await (ctx.prisma as any)[modelName].count()
        } catch {
          counts[model.name] = 0
        }
      }

      res.json({ models: counts })
    })

    // Статистика конкретной модели
    router.get('/stats/:model', async (req, res) => {
      const modelName = req.params.model
      const model = ctx.schema.models.find(
        m => m.name.toLowerCase() === modelName.toLowerCase()
      )

      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }

      const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1)
      const total = await (ctx.prisma as any)[prismaModel].count()

      res.json({ model: modelName, total })
    })

    // Защищаем все маршруты авторизацией
    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

### Маршруты без авторизации

Если маршрут должен быть публичным, не используйте `authMiddleware`:

```typescript
const healthModule: PradaModule = {
  name: 'health',
  routes: (ctx) => {
    const router = Router()

    router.get('/health', async (req, res) => {
      try {
        await ctx.prisma.$queryRaw`SELECT 1`
        res.json({ status: 'ok', database: 'connected' })
      } catch {
        res.status(503).json({ status: 'error', database: 'disconnected' })
      }
    })

    // Без authMiddleware -- маршрут публичный
    ctx.router.use('/api', router)
  }
}
```

## Модуль с middleware

Глобальный middleware модуля применяется ко всем маршрутам PRADA, включая встроенные:

```typescript
import type { PradaModule } from '@blysspeak/prada'
import type { Request, Response, NextFunction } from 'express'

const loggingModule: PradaModule = {
  name: 'logging',
  middleware: [
    (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now()
      res.on('finish', () => {
        const duration = Date.now() - start
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
      })
      next()
    }
  ]
}
```

### Middleware для ограничения запросов

```typescript
const rateLimitModule: PradaModule = {
  name: 'rate-limit',
  middleware: [
    (() => {
      const requests = new Map<string, number[]>()
      const WINDOW = 60 * 1000  // 1 минута
      const MAX = 100            // максимум запросов

      return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || 'unknown'
        const now = Date.now()

        const history = (requests.get(ip) || []).filter(t => now - t < WINDOW)
        history.push(now)
        requests.set(ip, history)

        if (history.length > MAX) {
          return res.status(429).json({ error: 'Too many requests' })
        }

        next()
      }
    })()
  ]
}
```

## Практические примеры

### Модуль загрузки файлов

```typescript
import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import type { PradaModule } from '@blysspeak/prada'

function createUploadModule(uploadDir: string): PradaModule {
  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`
      cb(null, uniqueName)
    }
  })

  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

  return {
    name: 'upload',
    routes: (ctx) => {
      const router = Router()

      router.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' })
        }

        res.json({
          filename: req.file.filename,
          url: `/uploads/${req.file.filename}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
        })
      })

      router.get('/uploads', async (req, res) => {
        const fs = require('fs').promises
        const files = await fs.readdir(uploadDir)
        res.json({ files })
      })

      ctx.router.use('/api', ctx.authMiddleware, router)
    }
  }
}

// Использование
const uploadModule = createUploadModule('./uploads')

app.use('/admin', await createPradaServer({
  prisma,
  modules: [uploadModule]
}))
```

### Модуль экспорта данных

```typescript
import { Router } from 'express'
import type { PradaModule } from '@blysspeak/prada'

const exportModule: PradaModule = {
  name: 'export',
  routes: (ctx) => {
    const router = Router()

    // Экспорт модели в CSV
    router.get('/export/:model/csv', async (req, res) => {
      const modelName = req.params.model
      const model = ctx.schema.models.find(
        m => m.name.toLowerCase() === modelName.toLowerCase()
      )

      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }

      const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1)
      const records = await (ctx.prisma as any)[prismaModel].findMany()

      // Формируем CSV
      const scalarFields = model.fields.filter(f => f.type !== 'relation')
      const header = scalarFields.map(f => f.name).join(',')
      const rows = records.map((r: any) =>
        scalarFields.map(f => JSON.stringify(r[f.name] ?? '')).join(',')
      )

      const csv = [header, ...rows].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${modelName}.csv"`)
      res.send(csv)
    })

    // Экспорт модели в JSON
    router.get('/export/:model/json', async (req, res) => {
      const modelName = req.params.model
      const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1)

      try {
        const records = await (ctx.prisma as any)[prismaModel].findMany()
        res.json({ data: records, count: records.length })
      } catch {
        res.status(404).json({ error: 'Model not found' })
      }
    })

    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

### Модуль вебхуков

```typescript
import { Router } from 'express'
import type { PradaModule, CrudHooks } from '@blysspeak/prada'

function createWebhookModule(webhookUrl: string): PradaModule {
  async function sendWebhook(event: string, data: unknown) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
      })
    } catch (err) {
      console.error('Webhook failed:', err)
    }
  }

  return {
    name: 'webhooks',
    routes: (ctx) => {
      const router = Router()

      // Эндпоинт для проверки настройки вебхуков
      router.get('/webhooks/status', (req, res) => {
        res.json({ url: webhookUrl, active: true })
      })

      ctx.router.use('/api', ctx.authMiddleware, router)
    }
  }
}

// Вебхуки можно комбинировать с хуками CRUD:
const webhookUrl = 'https://hooks.example.com/prada'

app.use('/admin', await createPradaServer({
  prisma,
  modules: [createWebhookModule(webhookUrl)],
  hooks: {
    '*': {
      afterCreate: async (record, ctx) => {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `${ctx.model}.created`,
            data: record
          })
        })
      },
      afterDelete: async (id, ctx) => {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `${ctx.model}.deleted`,
            data: { id }
          })
        })
      }
    }
  }
}))
```

## Использование схемы в модулях

Контекст модуля содержит разобранную схему, которую можно использовать для динамической генерации маршрутов:

```typescript
const introspectionModule: PradaModule = {
  name: 'introspection',
  routes: (ctx) => {
    const router = Router()

    // Список всех моделей и их полей
    router.get('/introspect', (req, res) => {
      const models = ctx.schema.models.map(m => ({
        name: m.name,
        fields: m.fields
          .filter(f => f.type !== 'relation')
          .map(f => ({ name: f.name, type: f.type, required: f.isRequired })),
        relations: m.fields
          .filter(f => f.type === 'relation')
          .map(f => ({ name: f.name, relationName: f.relationName })),
      }))

      res.json({ models, enums: ctx.schema.enums })
    })

    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}
```

## Встроенный модуль аудита

PRADA включает встроенный модуль аудита, который можно активировать через параметр `audit: true` в `createPradaServer`. Этот модуль автоматически отслеживает все изменения данных (создание, обновление, удаление) и предоставляет REST API для чтения журнала. Это хороший пример того, как модули расширяют функциональность -- подробнее см. [Справочник API](./api-reference.md#аудит).

## Советы

- Модуль должен монтировать маршруты на `ctx.router`, а не создавать собственный Express-сервер.
- Используйте `ctx.authMiddleware` для защиты маршрутов, требующих авторизации.
- Middleware из поля `middleware` применяется глобально -- используйте его осторожно.
- Имя модуля (`name`) используется только для логирования и не влияет на маршруты.
- Модули инициализируются после основных маршрутов PRADA, поэтому при конфликте путей приоритет имеют встроенные маршруты.
