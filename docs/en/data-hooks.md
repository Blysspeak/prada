# Data Hooks

PRADA provides React Query-based hooks for performing CRUD operations against any model in your schema. These hooks are designed for building custom pages that need database access without reimplementing API calls.

All hooks are available from `@blysspeak/prada-ui` and work inside any component rendered within the `<App>` component tree (which provides the necessary React Query and auth context).

## useModelList

Fetch a paginated list of records for a model.

```typescript
function useModelList<T = Record<string, unknown>>(
  modelName: string,
  params?: UseModelListParams
): {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}
```

### Parameters

```typescript
interface UseModelListParams {
  page?: number                       // Page number (default: 1)
  limit?: number                      // Records per page (default: 20, max: 100)
  sort?: string                       // Field name to sort by
  order?: 'asc' | 'desc'             // Sort direction (default: 'asc')
  search?: string                     // Full-text search across string fields
  include?: string                    // Comma-separated relation names to include
  filters?: Record<string, unknown>   // Field-value pairs for filtering (see operators below)
  enabled?: boolean                   // Whether to run the query (default: true)
}
```

Filters support operator suffixes via double-underscore notation:

```typescript
filters: {
  status: 'active',           // exact match
  name__contains: 'john',     // contains
  age__gte: 18,               // greater than or equal
  role__in: 'admin,editor'    // in list
}
```

Available operators: `__contains`, `__gte`, `__lte`, `__gt`, `__lt`, `__in`, `__not`, `__null`.

### Example: Paginated List with Search

```tsx
import { useModelList } from '@blysspeak/prada-ui'
import { useState } from 'react'

function UserList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: users, meta, isLoading } = useModelList('User', {
    page,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    search
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
      />

      <table>
        <thead>
          <tr><th>Name</th><th>Email</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={String(user.id)}>
              <td>{String(user.name)}</td>
              <td>{String(user.email)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        Page {meta.page} of {meta.totalPages} ({meta.total} total)
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  )
}
```

### Example: Filtered List

```tsx
function ActiveOrders() {
  const { data: orders, meta } = useModelList('Order', {
    filters: { status: 'active' },
    sort: 'createdAt',
    order: 'desc',
    include: 'customer'
  })

  return (
    <div>
      <h2>Active Orders ({meta.total})</h2>
      {orders.map(order => (
        <div key={String(order.id)}>
          Order #{String(order.id)} - {String((order as any).customer?.name)}
        </div>
      ))}
    </div>
  )
}
```

## useModelRecord

Fetch a single record by its ID.

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

The query is automatically disabled when `id` is `undefined`, so it is safe to call this hook before you have an ID.

### Example

```tsx
import { useModelRecord } from '@blysspeak/prada-ui'

function UserDetail({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useModelRecord('User', userId, {
    include: 'posts,comments'
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!user) return <p>User not found</p>

  return (
    <div>
      <h1>{String(user.name)}</h1>
      <p>Email: {String(user.email)}</p>
      <p>Posts: {Array.isArray(user.posts) ? user.posts.length : 0}</p>
    </div>
  )
}
```

## useModelCreate

Create a new record. Returns a mutation object.

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

After a successful creation, the hook automatically invalidates all queries for the same model, so any `useModelList` hooks will refetch.

### Example

```tsx
import { useModelCreate } from '@blysspeak/prada-ui'
import { useState } from 'react'

function CreateUser() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const { mutateAsync: create, isLoading, error } = useModelCreate('User')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await create({ name, email })
      alert(`Created user with ID: ${result.data.id}`)
      setName('')
      setEmail('')
    } catch (err) {
      // error is also available via the `error` property
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  )
}
```

## useModelUpdate

Update an existing record.

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

### Example

```tsx
import { useModelRecord, useModelUpdate } from '@blysspeak/prada-ui'
import { useState, useEffect } from 'react'

function EditUser({ userId }: { userId: string }) {
  const { data: user } = useModelRecord('User', userId)
  const { mutateAsync: update, isLoading } = useModelUpdate('User')
  const [name, setName] = useState('')

  useEffect(() => {
    if (user) setName(String(user.name || ''))
  }, [user])

  const handleSave = async () => {
    await update({ id: userId, data: { name } })
    alert('Updated successfully')
  }

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={handleSave} disabled={isLoading}>Save</button>
    </div>
  )
}
```

## useModelDelete

Delete a record by ID.

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

### Example

```tsx
import { useModelDelete } from '@blysspeak/prada-ui'

function DeleteButton({ modelName, id }: { modelName: string; id: string }) {
  const { mutateAsync: remove, isLoading } = useModelDelete(modelName)

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      await remove(id)
    }
  }

  return (
    <button onClick={handleDelete} disabled={isLoading} className="text-red-500">
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

## Combining Hooks with Custom Routes

The most powerful use of data hooks is in custom pages registered via `PradaConfig.routes`. This gives you full-page custom views with database access and sidebar navigation.

```tsx
import { useModelList, useModelCreate, useModelDelete } from '@blysspeak/prada-ui'
import type { PradaConfig } from '@blysspeak/prada-ui'
import { useState } from 'react'

function TaskBoard() {
  const { data: todo } = useModelList('Task', { filters: { status: 'todo' }, limit: 50 })
  const { data: doing } = useModelList('Task', { filters: { status: 'doing' }, limit: 50 })
  const { data: done } = useModelList('Task', { filters: { status: 'done' }, limit: 50 })
  const { mutate: createTask } = useModelCreate('Task')
  const { mutate: deleteTask } = useModelDelete('Task')

  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    if (newTitle.trim()) {
      createTask({ title: newTitle, status: 'todo' })
      setNewTitle('')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Board</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="border px-3 py-1 rounded"
        />
        <button onClick={handleAdd} className="px-4 py-1 bg-blue-500 text-white rounded">
          Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Column title="To Do" tasks={todo} onDelete={deleteTask} />
        <Column title="In Progress" tasks={doing} onDelete={deleteTask} />
        <Column title="Done" tasks={done} onDelete={deleteTask} />
      </div>
    </div>
  )
}

function Column({
  title,
  tasks,
  onDelete
}: {
  title: string
  tasks: Record<string, unknown>[]
  onDelete: (id: string | number) => void
}) {
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="font-bold mb-2">{title} ({tasks.length})</h2>
      {tasks.map(task => (
        <div key={String(task.id)} className="bg-white p-2 mb-2 rounded shadow flex justify-between">
          <span>{String(task.title)}</span>
          <button onClick={() => onDelete(task.id as string)} className="text-red-400 text-sm">
            x
          </button>
        </div>
      ))}
    </div>
  )
}

// Register the page
const config: PradaConfig = {
  routes: [
    {
      path: '/board',
      element: TaskBoard,
      sidebar: { label: 'Task Board', section: 'top' }
    }
  ]
}
```

## Query Key Structure

Under the hood, hooks use these React Query keys:

| Hook | Query Key |
|---|---|
| `useModelList('User', params)` | `['model', 'User', params]` |
| `useModelRecord('User', '123')` | `['model', 'User', '123', includeParam]` |

Mutations from `useModelCreate`, `useModelUpdate`, and `useModelDelete` invalidate all queries with the prefix `['model', modelName]`, so list and record queries for the same model refetch automatically after any mutation.
