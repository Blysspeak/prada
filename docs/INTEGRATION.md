# PRADA Integration Guide

Руководство по интеграции кастомного UI и бэкенда с использованием существующей авторизации PRADA.

## Содержание

- [Архитектура](#архитектура)
- [Backend интеграция](#backend-интеграция)
- [UI интеграция](#ui-интеграция)
- [Полные примеры](#полные-примеры)

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Ваше приложение                        │
├─────────────────────────────────────────────────────────────┤
│  Кастомные роуты    │  PRADA CRUD  │   Кастомный UI         │
│  /api/reports       │  /api/:model │   + PRADA компоненты   │
├─────────────────────┴──────────────┴────────────────────────┤
│                   PRADA Auth Middleware                     │
│              (JWT токены, сессии, проверка прав)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend интеграция

### 1. Базовая настройка с существующей авторизацией

```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'
import {
  parseSchema,
  createApiHandler,
  createCrudRoutes,
  createAuthService,
  createAuthMiddleware,
  createAuthRoutes,
  resolveUIPath
} from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

// Создаем сервисы
const schema = await parseSchema()
const api = createApiHandler(prisma, schema)
const auth = createAuthService({ login: 'admin', password: 'secret' })

// Middleware
app.use(express.json())

// Auth роуты (login, logout, refresh, me)
app.use('/api/auth', createAuthRoutes(auth))

// ВСЕ /api/* защищены авторизацией PRADA
app.use('/api', createAuthMiddleware(auth))

// Ваши кастомные роуты (уже защищены!)
app.get('/api/dashboard/stats', async (req, res) => {
  const users = await prisma.user.count()
  const posts = await prisma.post.count()
  res.json({ users, posts })
})

app.post('/api/reports/generate', async (req, res) => {
  // req.user доступен благодаря middleware
  const report = await generateReport(req.body, req.user)
  res.json(report)
})

// Стандартные CRUD роуты
app.use('/api', createCrudRoutes(api))

app.listen(3000)
```

### 2. Доступ к текущему пользователю

```typescript
import { createAuthMiddleware } from '@blysspeak/prada'

// После прохождения middleware, req.user содержит данные пользователя
app.get('/api/profile', createAuthMiddleware(auth), (req, res) => {
  // req.user = { login: 'admin', iat: ..., exp: ... }
  res.json({ user: req.user })
})
```

### 3. Опциональная авторизация

```typescript
import { createOptionalAuthMiddleware } from '@blysspeak/prada'

// Роут работает и для гостей, и для авторизованных
app.get('/api/public/posts', createOptionalAuthMiddleware(auth), (req, res) => {
  if (req.user) {
    // Показать приватные посты для авторизованных
    return res.json(await prisma.post.findMany())
  }
  // Только публичные для гостей
  res.json(await prisma.post.findMany({ where: { public: true } }))
})
```

### 4. Кастомные проверки прав

```typescript
import { verifyToken } from '@blysspeak/prada'

// Middleware для проверки роли
function requireRole(role: string) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

app.delete('/api/admin/users/:id',
  createAuthMiddleware(auth),
  requireRole('admin'),
  async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  }
)
```

### 5. Работа с токенами напрямую

```typescript
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  verifyPassword
} from '@blysspeak/prada'

// Кастомный login с дополнительной логикой
app.post('/api/auth/custom-login', async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Логируем вход
  await prisma.loginLog.create({ data: { userId: user.id, ip: req.ip } })

  const token = generateToken({ id: user.id, role: user.role }, 'your-secret')
  const refreshToken = generateRefreshToken({ id: user.id }, 'your-secret')

  res.cookie('token', token, { httpOnly: true })
  res.json({ user, token, refreshToken })
})
```

### 6. Хуки для расширения CRUD

```typescript
const api = createApiHandler(prisma, schema, {
  hooks: {
    // Глобальные хуки - для всех моделей
    '*': {
      beforeCreate: async (data, ctx) => {
        // Добавляем createdBy ко всем записям
        return { ...data, createdBy: ctx.user?.id }
      },
      afterDelete: async (id, ctx) => {
        // Логируем все удаления
        await prisma.auditLog.create({
          data: { action: 'DELETE', model: ctx.model, recordId: String(id) }
        })
      }
    },

    // Хуки для конкретной модели
    User: {
      beforeCreate: async (data) => ({
        ...data,
        password: await hashPassword(data.password)
      }),
      afterCreate: async (user) => {
        await sendWelcomeEmail(user.email)
      }
    },

    Post: {
      beforeFind: async (query, ctx) => {
        // Показывать только свои посты для не-админов
        if (ctx.user?.role !== 'admin') {
          query.filters = { ...query.filters, authorId: ctx.user?.id }
        }
        return query
      }
    }
  }
})
```

### 7. Ограничение действий по моделям

```typescript
const api = createApiHandler(prisma, schema, {
  models: {
    User: {
      actions: ['read', 'update'], // Нельзя создавать/удалять через API
      fields: {
        password: { hidden: true },
        email: { readonly: true }
      }
    },
    AuditLog: {
      actions: ['read'] // Только чтение логов
    },
    Settings: {
      actions: [] // Полностью закрыт через API
    }
  }
})
```

---

## UI интеграция

### 1. Использование PRADA компонентов в своем React приложении

```tsx
import {
  AuthProvider,
  SchemaProvider,
  useAuth,
  useSchema,
  DataTable,
  DynamicForm,
  Layout,
  Sidebar
} from '@blysspeak/prada-ui'

function App() {
  return (
    <AuthProvider apiUrl="/api">
      <SchemaProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </Router>
      </SchemaProvider>
    </AuthProvider>
  )
}

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />

  return (
    <Layout>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/reports" element={<CustomReportsPage />} />
      </Routes>
    </Layout>
  )
}
```

### 2. Кастомная страница с PRADA DataTable

```tsx
import { DataTable, Pagination, useSchema } from '@blysspeak/prada-ui'
import { useState, useEffect } from 'react'

function UsersPage() {
  const schema = useSchema()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })

  useEffect(() => {
    fetch(`/api/user?page=${meta.page}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.data)
        setMeta(data.meta)
      })
  }, [meta.page])

  const userModel = schema?.models.find(m => m.name === 'User')

  return (
    <div>
      <h1>Пользователи</h1>

      <DataTable
        data={users}
        columns={userModel?.fields || []}
        onRowClick={(user) => navigate(`/users/${user.id}`)}
        renderCell={(field, value, row) => {
          // Кастомный рендер для статуса
          if (field.name === 'status') {
            return <StatusBadge status={value} />
          }
          // Кастомный рендер для аватара
          if (field.name === 'avatar') {
            return <Avatar src={value} name={row.name} />
          }
          return value
        }}
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={(page) => setMeta(m => ({ ...m, page }))}
      />
    </div>
  )
}
```

### 3. Кастомная форма с PRADA полями

```tsx
import {
  TextField,
  NumberField,
  BooleanField,
  EnumField,
  DateTimeField,
  JsonField,
  DynamicForm
} from '@blysspeak/prada-ui'

function CreateUserForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: 0,
    role: 'user',
    isActive: true,
    birthDate: null,
    metadata: {}
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Имя"
        value={form.name}
        onChange={(v) => setForm(f => ({ ...f, name: v }))}
        required
      />

      <TextField
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm(f => ({ ...f, email: v }))}
        required
      />

      <NumberField
        label="Возраст"
        value={form.age}
        onChange={(v) => setForm(f => ({ ...f, age: v }))}
        min={0}
        max={150}
      />

      <EnumField
        label="Роль"
        value={form.role}
        onChange={(v) => setForm(f => ({ ...f, role: v }))}
        options={['user', 'moderator', 'admin']}
      />

      <BooleanField
        label="Активен"
        value={form.isActive}
        onChange={(v) => setForm(f => ({ ...f, isActive: v }))}
      />

      <DateTimeField
        label="Дата рождения"
        value={form.birthDate}
        onChange={(v) => setForm(f => ({ ...f, birthDate: v }))}
      />

      <JsonField
        label="Метаданные"
        value={form.metadata}
        onChange={(v) => setForm(f => ({ ...f, metadata: v }))}
      />

      <button type="submit">Создать</button>
    </form>
  )
}
```

### 4. Использование DynamicForm для автогенерации

```tsx
import { DynamicForm, useSchema } from '@blysspeak/prada-ui'

function EditUserPage({ userId }) {
  const schema = useSchema()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`/api/user/${userId}`).then(r => r.json()).then(d => setUser(d.data))
  }, [userId])

  const userModel = schema?.models.find(m => m.name === 'User')

  const handleSubmit = async (data) => {
    await fetch(`/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  if (!user || !userModel) return <div>Loading...</div>

  return (
    <DynamicForm
      model={userModel}
      initialData={user}
      onSubmit={handleSubmit}
      // Скрыть некоторые поля
      hiddenFields={['id', 'createdAt', 'updatedAt']}
      // Сделать поля только для чтения
      readonlyFields={['email']}
      // Кастомные лейблы
      labels={{
        name: 'Полное имя',
        isActive: 'Пользователь активен'
      }}
    />
  )
}
```

### 5. Работа с авторизацией в UI

```tsx
import { useAuth, api } from '@blysspeak/prada-ui'

function Header() {
  const { user, logout, loading } = useAuth()

  if (loading) return null

  return (
    <header>
      <nav>
        <a href="/">Главная</a>
        {user ? (
          <>
            <span>Привет, {user.login}</span>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <a href="/login">Войти</a>
        )}
      </nav>
    </header>
  )
}

// Кастомная логин-форма
function CustomLoginForm() {
  const { login } = useAuth()
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)

    try {
      await login(form.get('email'), form.get('password'))
      navigate('/')
    } catch (err) {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Пароль" />
      <button type="submit">Войти</button>
    </form>
  )
}
```

### 6. API клиент с авторизацией

```tsx
import { api } from '@blysspeak/prada-ui'

// api уже настроен с токенами и refresh логикой

// Получить список
const { data, meta } = await api.get('/user', {
  page: 1,
  limit: 20,
  search: 'john',
  sort: 'createdAt',
  order: 'desc'
})

// Получить одну запись
const user = await api.get('/user/123')

// Создать
const newUser = await api.post('/user', { name: 'John', email: 'john@example.com' })

// Обновить
const updated = await api.put('/user/123', { name: 'John Doe' })

// Удалить
await api.delete('/user/123')

// Кастомные эндпоинты
const stats = await api.get('/dashboard/stats')
const report = await api.post('/reports/generate', { type: 'monthly' })
```

### 7. Настройка темы и локализации

```tsx
import {
  SettingsProvider,
  useSettings,
  AnimatedThemeToggler
} from '@blysspeak/prada-ui'

function App() {
  return (
    <SettingsProvider
      defaultTheme="dark"
      defaultLanguage="ru"
      defaultDateFormat="DD.MM.YYYY"
    >
      <YourApp />
    </SettingsProvider>
  )
}

function SettingsPanel() {
  const { theme, setTheme, language, setLanguage, dateFormat, setDateFormat } = useSettings()

  return (
    <div>
      <AnimatedThemeToggler />

      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="ru">Русский</option>
      </select>

      <select value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
        <option value="DD.MM.YYYY">DD.MM.YYYY</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
      </select>
    </div>
  )
}
```

---

## Полные примеры

### Пример 1: Полностью кастомный бэкенд с PRADA авторизацией

```typescript
// server.ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import {
  createAuthService,
  createAuthMiddleware,
  createAuthRoutes,
  hashPassword,
  verifyPassword,
  generateToken
} from '@blysspeak/prada'

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

// Используем PRADA auth service
const auth = createAuthService({ login: 'admin', password: 'secret' })

// Стандартные auth роуты
app.use('/api/auth', createAuthRoutes(auth))

// Защищаем все /api/*
app.use('/api', createAuthMiddleware(auth))

// Полностью кастомные роуты
app.get('/api/dashboard', async (req, res) => {
  const [users, posts, comments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count()
  ])

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  res.json({ stats: { users, posts, comments }, recentUsers })
})

app.get('/api/users', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  res.json({
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
})

app.post('/api/users', async (req, res) => {
  const { email, password, name } = req.body

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: await hashPassword(password)
    }
  })

  res.status(201).json(user)
})

app.listen(3000)
```

### Пример 2: Микс PRADA CRUD + кастомные роуты

```typescript
// server.ts
import express from 'express'
import { PrismaClient } from '@prisma/client'
import {
  parseSchema,
  createApiHandler,
  createCrudRoutes,
  createAuthService,
  createAuthMiddleware,
  createAuthRoutes,
  resolveUIPath
} from '@blysspeak/prada'
import { static as serveStatic } from 'express'

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

const schema = await parseSchema()
const auth = createAuthService({ login: 'admin', password: 'secret' })

// API с хуками
const api = createApiHandler(prisma, schema, {
  hooks: {
    User: {
      afterCreate: async (user) => {
        await sendWelcomeEmail(user.email)
      }
    }
  },
  models: {
    User: {
      fields: { password: { hidden: true } }
    }
  }
})

// Auth
app.use('/api/auth', createAuthRoutes(auth))

// Защита
app.use('/api', createAuthMiddleware(auth))

// Кастомные роуты ПЕРЕД CRUD
app.get('/api/me', (req, res) => res.json(req.user))

app.get('/api/stats', async (req, res) => {
  const stats = await getStats()
  res.json(stats)
})

app.post('/api/upload', multer().single('file'), async (req, res) => {
  const url = await uploadToS3(req.file)
  res.json({ url })
})

// PRADA CRUD (обрабатывает все остальные /api/:model)
app.use('/api', createCrudRoutes(api))

// UI
const uiPath = await resolveUIPath()
app.use(serveStatic(uiPath))
app.get('*', (req, res) => res.sendFile(`${uiPath}/index.html`))

app.listen(3000)
```

### Пример 3: Полностью кастомный React UI с PRADA компонентами

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  AuthProvider,
  SchemaProvider,
  SettingsProvider,
  useAuth
} from '@blysspeak/prada-ui'

import { CustomLogin } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { UsersList } from './pages/UsersList'
import { UserEdit } from './pages/UserEdit'
import { Reports } from './pages/Reports'
import { CustomLayout } from './components/Layout'

export function App() {
  return (
    <SettingsProvider defaultTheme="dark" defaultLanguage="ru">
      <AuthProvider apiUrl="/api">
        <SchemaProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<CustomLogin />} />
              <Route path="/*" element={<ProtectedApp />} />
            </Routes>
          </BrowserRouter>
        </SchemaProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" />

  return (
    <CustomLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UserEdit />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </CustomLayout>
  )
}
```

```tsx
// pages/UsersList.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, Pagination, api, useSchema } from '@blysspeak/prada-ui'

export function UsersList() {
  const schema = useSchema()
  const [data, setData] = useState({ users: [], meta: { page: 1, totalPages: 1 } })
  const [search, setSearch] = useState('')

  const fetchUsers = async (page = 1) => {
    const res = await api.get('/user', { page, limit: 20, search })
    setData({ users: res.data, meta: res.meta })
  }

  useEffect(() => { fetchUsers() }, [search])

  const userModel = schema?.models.find(m => m.name === 'User')

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <Link to="/users/new" className="btn btn-primary">
          Добавить
        </Link>
      </div>

      <input
        type="search"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input mb-4"
      />

      <DataTable
        data={data.users}
        columns={userModel?.fields.filter(f => !f.hidden) || []}
        renderCell={(field, value, row) => {
          if (field.name === 'name') {
            return <Link to={`/users/${row.id}`} className="text-blue-500">{value}</Link>
          }
          if (field.name === 'isActive') {
            return value ? '✅' : '❌'
          }
          return value
        }}
      />

      <Pagination
        page={data.meta.page}
        totalPages={data.meta.totalPages}
        onPageChange={fetchUsers}
      />
    </div>
  )
}
```

```tsx
// pages/UserEdit.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  DynamicForm,
  api,
  useSchema,
  TextField,
  EnumField,
  BooleanField
} from '@blysspeak/prada-ui'

export function UserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const schema = useSchema()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id === 'new') {
      setUser({})
      setLoading(false)
    } else {
      api.get(`/user/${id}`).then(res => {
        setUser(res.data)
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async (data) => {
    if (id === 'new') {
      await api.post('/user', data)
    } else {
      await api.put(`/user/${id}`, data)
    }
    navigate('/users')
  }

  const handleDelete = async () => {
    if (confirm('Удалить пользователя?')) {
      await api.delete(`/user/${id}`)
      navigate('/users')
    }
  }

  if (loading) return <div>Loading...</div>

  const userModel = schema?.models.find(m => m.name === 'User')

  // Вариант 1: Автоматическая форма
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {id === 'new' ? 'Новый пользователь' : 'Редактирование'}
      </h1>

      <DynamicForm
        model={userModel}
        initialData={user}
        onSubmit={handleSubmit}
        hiddenFields={['id', 'createdAt', 'updatedAt']}
        readonlyFields={id !== 'new' ? ['email'] : []}
      />

      {id !== 'new' && (
        <button onClick={handleDelete} className="btn btn-danger mt-4">
          Удалить
        </button>
      )}
    </div>
  )

  // Вариант 2: Кастомная форма с PRADA полями
  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(user) }}>
      <TextField
        label="Имя"
        value={user.name || ''}
        onChange={v => setUser(u => ({ ...u, name: v }))}
        required
      />

      <TextField
        label="Email"
        type="email"
        value={user.email || ''}
        onChange={v => setUser(u => ({ ...u, email: v }))}
        required
        disabled={id !== 'new'}
      />

      <EnumField
        label="Роль"
        value={user.role || 'user'}
        onChange={v => setUser(u => ({ ...u, role: v }))}
        options={['user', 'moderator', 'admin']}
      />

      <BooleanField
        label="Активен"
        value={user.isActive ?? true}
        onChange={v => setUser(u => ({ ...u, isActive: v }))}
      />

      <div className="flex gap-4 mt-6">
        <button type="submit" className="btn btn-primary">Сохранить</button>
        <button type="button" onClick={() => navigate('/users')} className="btn">
          Отмена
        </button>
      </div>
    </form>
  )
}
```

---

## Типы TypeScript

```typescript
import type {
  // Schema
  Schema, Model, Field, Enum,

  // API
  PrismaClient, ApiHandler,
  FindManyParams, PaginatedResponse,

  // Hooks
  CrudHooks, CrudHookContext,
  BeforeCreateHook, AfterCreateHook,
  BeforeUpdateHook, AfterUpdateHook,
  BeforeDeleteHook, AfterDeleteHook,
  BeforeFindHook, AfterFindHook,

  // Config
  ModelConfig, ModelConfigs, FieldConfig,

  // Auth
  AuthService, AuthConfig
} from '@blysspeak/prada'

import type {
  // UI
  PradaField, PradaModel, PradaSchema, PradaEnum,
  User, AuthState
} from '@blysspeak/prada-ui'
```
