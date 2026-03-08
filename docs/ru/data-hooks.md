# Хуки данных

## Обзор

PRADA UI предоставляет набор React-хуков для работы с данными. Хуки построены на базе `@tanstack/react-query` и предоставляют типизированный доступ к CRUD-операциям для любой модели базы данных. Они предназначены для использования в кастомных страницах и компонентах.

## useModelList

Получение пагинированного списка записей модели.

### Сигнатура

```typescript
function useModelList<T = Record<string, unknown>>(
  modelName: string,
  params?: UseModelListParams
): {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
  isLoading: boolean
  error: Error | null
  refetch: () => void
  isFetching: boolean
}
```

### Параметры (UseModelListParams)

```typescript
interface UseModelListParams {
  /** Номер страницы (начиная с 1) */
  page?: number
  /** Количество записей на странице (по умолчанию 20, максимум 100) */
  limit?: number
  /** Поле для сортировки */
  sort?: string
  /** Направление сортировки */
  order?: 'asc' | 'desc'
  /** Строка поиска (ищет по всем строковым полям) */
  search?: string
  /** Имена связей для включения (через запятую) */
  include?: string
  /** Фильтры (имя поля -> значение). Поддерживает операторы сравнения */
  filters?: Record<string, unknown>
  /** Включить/отключить запрос (по умолчанию true) */
  enabled?: boolean
}
```

### Возвращаемые значения

| Поле | Тип | Описание |
|---|---|---|
| `data` | `T[]` | Массив записей (пустой массив при загрузке) |
| `meta.total` | `number` | Общее количество записей |
| `meta.page` | `number` | Текущая страница |
| `meta.limit` | `number` | Записей на странице |
| `meta.totalPages` | `number` | Общее количество страниц |
| `isLoading` | `boolean` | Первая загрузка (нет кешированных данных) |
| `isFetching` | `boolean` | Любая загрузка (включая фоновое обновление) |
| `error` | `Error \| null` | Ошибка запроса |
| `refetch` | `() => void` | Принудительное обновление данных |

### Примеры

Базовое использование:

```tsx
import { useModelList } from '@blysspeak/prada-ui'

function UserList() {
  const { data, meta, isLoading } = useModelList('User')

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div>
      <p>Всего пользователей: {meta.total}</p>
      <ul>
        {data.map((user: any) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  )
}
```

С параметрами:

```tsx
function RecentOrders() {
  const { data, meta, isLoading, refetch } = useModelList('Order', {
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    search: 'pending',
    filters: { status: 'pending' },
    include: 'customer,items',
  })

  return (
    <div>
      <button onClick={() => refetch()}>Обновить</button>
      <p>Страница {meta.page} из {meta.totalPages}</p>
      {data.map((order: any) => (
        <div key={order.id}>
          Заказ #{order.id} -- {order.customer?.name}
        </div>
      ))}
    </div>
  )
}
```

С операторами фильтрации:

```tsx
function FilteredUsers() {
  const { data } = useModelList('User', {
    filters: {
      status: 'active',           // точное совпадение
      name__contains: 'john',     // содержит
      age__gte: 18,               // больше или равно
      role__in: 'admin,editor'    // входит в список
    }
  })

  return <div>{data.length} записей</div>
}
```

Доступные операторы: `__contains`, `__gte`, `__lte`, `__gt`, `__lt`, `__in`, `__not`, `__null`. Подробнее в [Справочнике API](./api-reference.md).

Условный запрос:

```tsx
function ConditionalList({ modelName }: { modelName: string | null }) {
  const { data, isLoading } = useModelList(modelName ?? '', {
    enabled: !!modelName,  // Запрос выполняется только если modelName задано
  })

  if (!modelName) return <div>Выберите модель</div>
  if (isLoading) return <div>Загрузка...</div>

  return <div>{data.length} записей</div>
}
```

## useModelRecord

Получение одной записи по идентификатору.

### Сигнатура

```typescript
function useModelRecord<T = Record<string, unknown>>(
  modelName: string,
  id: string | number | undefined,
  options?: { include?: string; enabled?: boolean }
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
```

### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `modelName` | `string` | Имя модели (PascalCase) |
| `id` | `string \| number \| undefined` | Идентификатор записи |
| `options.include` | `string` | Связи для включения (через запятую) |
| `options.enabled` | `boolean` | Включить/отключить запрос (по умолчанию true) |

Запрос автоматически отключается, если `id` равен `undefined`.

### Возвращаемые значения

| Поле | Тип | Описание |
|---|---|---|
| `data` | `T \| null` | Запись или null |
| `isLoading` | `boolean` | Идет загрузка |
| `error` | `Error \| null` | Ошибка запроса |
| `refetch` | `() => void` | Принудительное обновление |

### Пример

```tsx
import { useModelRecord } from '@blysspeak/prada-ui'

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useModelRecord('User', userId, {
    include: 'posts,comments'
  })

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error.message}</div>
  if (!user) return <div>Пользователь не найден</div>

  return (
    <div>
      <h2>{(user as any).name}</h2>
      <p>Email: {(user as any).email}</p>
      <h3>Публикации:</h3>
      <ul>
        {((user as any).posts || []).map((post: any) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## useModelCreate

Создание новой записи.

### Сигнатура

```typescript
function useModelCreate<T = Record<string, unknown>>(
  modelName: string
): {
  mutate: (data: Record<string, unknown>) => void
  mutateAsync: (data: Record<string, unknown>) => Promise<{ data: T }>
  data: T | null
  isLoading: boolean
  error: Error | null
  reset: () => void
}
```

### Возвращаемые значения

| Поле | Тип | Описание |
|---|---|---|
| `mutate` | `(data) => void` | Запустить создание (fire-and-forget) |
| `mutateAsync` | `(data) => Promise` | Запустить создание (с ожиданием результата) |
| `data` | `T \| null` | Созданная запись |
| `isLoading` | `boolean` | Идет создание |
| `error` | `Error \| null` | Ошибка создания |
| `reset` | `() => void` | Сбросить состояние мутации |

После успешного создания автоматически инвалидируются все запросы `useModelList` для этой модели.

### Пример

```tsx
import { useModelCreate } from '@blysspeak/prada-ui'
import { useState } from 'react'

function CreateUserForm() {
  const { mutate, mutateAsync, isLoading, error } = useModelCreate('User')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Вариант 1: fire-and-forget
  const handleSubmit = () => {
    mutate({ name, email, role: 'user' })
  }

  // Вариант 2: с ожиданием результата
  const handleSubmitAsync = async () => {
    try {
      const result = await mutateAsync({ name, email, role: 'user' })
      console.log('Created:', result.data)
      // Редирект или уведомление
    } catch (err) {
      console.error('Failed:', err)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmitAsync() }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <button disabled={isLoading}>
        {isLoading ? 'Создание...' : 'Создать'}
      </button>
      {error && <div className="text-red-500">{error.message}</div>}
    </form>
  )
}
```

## useModelUpdate

Обновление существующей записи.

### Сигнатура

```typescript
function useModelUpdate<T = Record<string, unknown>>(
  modelName: string
): {
  mutate: (args: { id: string | number; data: Record<string, unknown> }) => void
  mutateAsync: (args: { id: string | number; data: Record<string, unknown> }) => Promise<{ data: T }>
  data: T | null
  isLoading: boolean
  error: Error | null
  reset: () => void
}
```

### Пример

```tsx
import { useModelUpdate, useModelRecord } from '@blysspeak/prada-ui'
import { useState, useEffect } from 'react'

function EditUserForm({ userId }: { userId: string }) {
  const { data: user, isLoading: loadingUser } = useModelRecord('User', userId)
  const { mutateAsync, isLoading: saving, error } = useModelUpdate('User')
  const [name, setName] = useState('')

  useEffect(() => {
    if (user) setName((user as any).name || '')
  }, [user])

  if (loadingUser) return <div>Загрузка...</div>

  const handleSave = async () => {
    await mutateAsync({
      id: userId,
      data: { name }
    })
    alert('Сохранено!')
  }

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  )
}
```

## useModelDelete

Удаление записи по идентификатору.

### Сигнатура

```typescript
function useModelDelete(
  modelName: string
): {
  mutate: (id: string | number) => void
  mutateAsync: (id: string | number) => Promise<void>
  isLoading: boolean
  error: Error | null
  reset: () => void
}
```

### Пример

```tsx
import { useModelDelete, useModelList } from '@blysspeak/prada-ui'

function UserListWithDelete() {
  const { data: users } = useModelList('User')
  const { mutateAsync: deleteUser, isLoading: deleting } = useModelDelete('User')

  const handleDelete = async (id: number) => {
    if (confirm('Удалить пользователя?')) {
      await deleteUser(id)
      // Список обновится автоматически (invalidateQueries)
    }
  }

  return (
    <ul>
      {users.map((user: any) => (
        <li key={user.id}>
          {user.name}
          <button
            onClick={() => handleDelete(user.id)}
            disabled={deleting}
          >
            Удалить
          </button>
        </li>
      ))}
    </ul>
  )
}
```

## Комбинирование хуков

### CRUD-страница для кастомной модели

```tsx
import {
  useModelList,
  useModelRecord,
  useModelCreate,
  useModelUpdate,
  useModelDelete
} from '@blysspeak/prada-ui'
import { useState } from 'react'

function TaskManager() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  // Список задач
  const { data: tasks, meta, isLoading } = useModelList('Task', {
    sort: 'createdAt',
    order: 'desc',
    limit: 50,
  })

  // Выбранная задача
  const { data: selectedTask } = useModelRecord('Task', selectedId ?? undefined, {
    enabled: selectedId !== null,
    include: 'assignee,comments',
  })

  // Мутации
  const { mutateAsync: createTask } = useModelCreate('Task')
  const { mutateAsync: updateTask } = useModelUpdate('Task')
  const { mutateAsync: deleteTask } = useModelDelete('Task')

  const handleCreate = async () => {
    await createTask({ title: newTitle, status: 'pending' })
    setNewTitle('')
    setIsCreating(false)
  }

  const handleToggle = async (task: any) => {
    await updateTask({
      id: task.id,
      data: { status: task.status === 'done' ? 'pending' : 'done' }
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('Удалить задачу?')) {
      await deleteTask(id)
      if (selectedId === id) setSelectedId(null)
    }
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className="flex gap-6 p-6">
      {/* Список задач */}
      <div className="flex-1">
        <div className="flex justify-between mb-4">
          <h1 className="text-xl font-bold">Задачи ({meta.total})</h1>
          <button onClick={() => setIsCreating(true)}>Новая задача</button>
        </div>

        {isCreating && (
          <div className="flex gap-2 mb-4">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Название задачи"
            />
            <button onClick={handleCreate}>Создать</button>
            <button onClick={() => setIsCreating(false)}>Отмена</button>
          </div>
        )}

        <ul className="space-y-2">
          {tasks.map((task: any) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-3 border rounded cursor-pointer"
              onClick={() => setSelectedId(task.id)}
            >
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() => handleToggle(task)}
                onClick={e => e.stopPropagation()}
              />
              <span className={task.status === 'done' ? 'line-through text-gray-400' : ''}>
                {task.title}
              </span>
              <button
                className="ml-auto text-red-500"
                onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Детали задачи */}
      {selectedTask && (
        <div className="w-80 border-l pl-6">
          <h2 className="text-lg font-bold mb-2">{(selectedTask as any).title}</h2>
          <p>Статус: {(selectedTask as any).status}</p>
          {(selectedTask as any).assignee && (
            <p>Исполнитель: {(selectedTask as any).assignee.name}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

## Интеграция с PradaConfig

Кастомные страницы с хуками данных легко подключаются через систему маршрутов PradaConfig:

```tsx
import { App } from '@blysspeak/prada-ui'
import type { PradaConfig } from '@blysspeak/prada-ui'
import { ClipboardList } from 'lucide-react'

const config: PradaConfig = {
  routes: [
    {
      path: '/tasks',
      element: TaskManager,
      sidebar: {
        label: 'Задачи',
        icon: ClipboardList,
        section: 'top',
      }
    }
  ]
}

function AdminApp() {
  return <App config={config} />
}
```

## Автоматическая инвалидация кеша

Все мутационные хуки (`useModelCreate`, `useModelUpdate`, `useModelDelete`) автоматически инвалидируют кеш списка соответствующей модели после успешного выполнения. Это означает:

- После создания записи через `useModelCreate('User')` все компоненты, использующие `useModelList('User')`, автоматически обновятся.
- После обновления или удаления -- аналогично.
- Инвалидация привязана к имени модели: мутация в модели `User` не затронет данные модели `Order`.

Если нужно инвалидировать данные другой модели, можно использовать `queryClient` напрямую:

```tsx
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteUser } = useModelDelete('User')

  const handleDelete = async (id: number) => {
    await deleteUser(id)
    // Дополнительно инвалидировать заказы этого пользователя
    queryClient.invalidateQueries({ queryKey: ['model', 'Order'] })
  }
}
```
