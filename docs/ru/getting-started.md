# Быстрый старт

## Требования

- **Node.js** 18 или выше
- **pnpm** (менеджер пакетов)
- **PostgreSQL** (база данных)
- **Prisma** (ORM, `@prisma/client` >= 5.0.0)

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/blysspeak/prada.git
cd prada

# Установить зависимости
pnpm install

# Собрать все пакеты
pnpm build
```

Если нужна только серверная часть или только UI:

```bash
pnpm build:main   # Собрать бэкенд (@blysspeak/prada)
pnpm build:ui     # Собрать UI (@blysspeak/prada-ui)
```

## Базовое использование

Минимальный пример подключения PRADA к Express-серверу:

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'secret' }
}))

app.listen(3000, () => {
  console.log('Admin panel: http://localhost:3000/admin')
})
```

После запуска откройте `http://localhost:3000/admin` в браузере. PRADA автоматически прочитает Prisma-схему, создаст CRUD-эндпоинты для всех моделей и отобразит интерфейс администрирования.

## Переменные окружения

PRADA поддерживает конфигурацию через переменные окружения:

| Переменная | Описание | Обязательная |
|---|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL | Да (для Prisma) |
| `PRADA_LOGIN` | Логин администратора | Нет |
| `PRADA_PASSWORD` | Пароль администратора | Нет |
| `PRADA_SECRET` | Секрет для JWT-токенов (генерируется автоматически, если не задан) | Нет |

Если `PRADA_LOGIN` и `PRADA_PASSWORD` не заданы ни через переменные окружения, ни через параметр `auth` в коде, PRADA покажет страницу первоначальной настройки (setup wizard) при первом открытии в браузере.

## Авторизация

Есть три способа задать учетные данные:

### 1. Через код

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  auth: { login: 'admin', password: 'my-password' }
}))
```

### 2. Через переменные окружения

```bash
PRADA_LOGIN=admin PRADA_PASSWORD=my-password node server.js
```

### 3. Через мастер настройки

Если учетные данные не заданы, при первом открытии панели отобразится форма настройки. Логин и хэш пароля сохраняются в файле `.prada/credentials` в рабочей директории проекта.

## Путь к Prisma-схеме

По умолчанию PRADA ищет схему в стандартных расположениях:

1. `prisma/schema.prisma`
2. `prisma/schema/` (директория с несколькими `.prisma`-файлами)
3. `schema.prisma`
4. `src/prisma/schema.prisma`

Можно указать путь явно:

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema.prisma'
}))
```

Для модульной схемы (несколько `.prisma`-файлов в одной директории):

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema'  // директория
}))
```

## Режим разработки

Для разработки удобно запускать бэкенд и UI раздельно:

```bash
# Терминал 1: запуск бэкенда (ваш Express-сервер)
node server.js

# Терминал 2: запуск UI в режиме разработки (Vite dev server на порту 5173)
pnpm dev
```

UI dev-сервер проксирует API-запросы (`/admin/api/*`) на `localhost:3000`.

## Сборка для продакшена

```bash
# Собрать все пакеты
pnpm build

# Запустить сервер
node server.js
```

В продакшен-режиме PRADA раздает собранные статические файлы UI через Express. Отдельный UI-сервер не требуется.

## Пример с хуками и модулями

Более полный пример, использующий хуки и модули:

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@blysspeak/prada'
import type { PradaModule } from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

// Модуль статистики
const statsModule: PradaModule = {
  name: 'stats',
  routes: (ctx) => {
    const { Router } = await import('express')
    const router = Router()

    router.get('/stats/overview', async (req, res) => {
      const userCount = await ctx.prisma.user.count()
      res.json({ users: userCount })
    })

    ctx.router.use('/api', ctx.authMiddleware, router)
  }
}

app.use('/admin', await createPradaServer({
  prisma,
  modules: [statsModule],
  audit: true,
  hooks: {
    '*': {
      beforeCreate: async (data) => ({
        ...data,
        createdAt: new Date()
      })
    },
    User: {
      afterCreate: async (record) => {
        console.log('New user created:', record)
      }
    }
  }
}))

app.listen(3000)
```

## Следующие шаги

- [Архитектура](./architecture.md) -- подробное описание устройства библиотеки
- [Кастомизация UI](./customization.md) -- настройка интерфейса
- [Модули](./modules.md) -- расширение функциональности бэкенда
- [Хуки данных](./data-hooks.md) -- React-хуки для работы с данными
- [Справочник API](./api-reference.md) -- полный список экспортов и эндпоинтов
- Журнал аудита -- отслеживание всех изменений данных (см. [Справочник API](./api-reference.md#аудит))
