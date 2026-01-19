# Установка и интеграция PRADA

## Установка

### Требования
- Node.js (версия 18 или выше)
- pnpm
- Prisma ORM (уже установлен в вашем проекте)

### Шаги

1. Клонируйте репозиторий PRADA:
   ```bash
   git clone https://github.com/blysspeak/prada.git
   cd prada
   ```

2. Установите зависимости:
   ```bash
   pnpm install
   ```

3. Соберите пакеты:
   ```bash
   pnpm build
   ```

## Интеграция с вашим Express-приложением

### 1. Базовая интеграция

Чтобы интегрировать PRADA в ваше Express-приложение, добавьте следующий код:

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createPradaServer } from '@prada/server'

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

// Подключаем PRADA по адресу /admin
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema.prisma', // Путь к вашему файлу schema.prisma
  auth: {
    email: process.env.ADMIN_EMAIL!, // Email администратора
    password: process.env.ADMIN_PASSWORD!, // Пароль администратора
    jwtSecret: process.env.JWT_SECRET // Секретный ключ для JWT
  }
}))

app.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000')
  console.log('Админ-панель доступна по адресу http://localhost:3000/admin')
})
```

### 2. Конфигурация моделей (опционально)

Вы можете настроить поведение конкретных моделей, например, скрыть поля или ограничить действия:

```typescript
app.use('/admin', await createPradaServer({
  prisma,
  schemaPath: './prisma/schema.prisma',
  auth: { ... },
  models: {
    User: {
      fields: {
        password: { hidden: true }, // Скрыть поле пароля
        email: { searchable: true } // Сделать поле email searchable
      },
      actions: ['create', 'read', 'update'] // Отключить удаление
    }
  }
}))
```

## Переменные окружения

Для корректной работы PRADA вам нужно задать следующие переменные окружения:

- `ADMIN_EMAIL` — Email администратора
- `ADMIN_PASSWORD` — Пароль администратора
- `JWT_SECRET` — Секретный ключ для генерации JWT-токенов

Пример файла `.env`:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

## Запуск в режиме разработки

Для запуска PRADA в режиме разработки выполните:

```bash
cd packages/ui
pnpm dev
```

Это запустит сервер разработки для пользовательского интерфейса.

## Сборка для продакшена

Для сборки всех пакетов выполните:

```bash
pnpm build
```

Это создаст продакшен-версии всех пакетов в соответствующих директориях `dist`.