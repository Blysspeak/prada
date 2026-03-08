# Кастомизация UI

## Обзор PradaConfig

`PradaConfig` -- единая точка входа для всей кастомизации интерфейса PRADA. Конфигурация передается компоненту `App` через проп `config`:

```tsx
import { App } from '@blysspeak/prada-ui'
import type { PradaConfig } from '@blysspeak/prada-ui'

const config: PradaConfig = {
  fields: { ... },     // Кастомные поля форм
  cells: { ... },      // Кастомные ячейки таблиц
  pages: { ... },      // Замена целых страниц
  slots: { ... },      // Вставка компонентов в слоты
  routes: [ ... ],     // Кастомные маршруты
  sidebar: { ... },    // Настройка боковой панели
  actions: { ... },    // Настройка действий в таблице
}

function AdminPanel() {
  return <App config={config} />
}
```

Все секции конфигурации опциональны. Если секция не указана, используется поведение по умолчанию.

## Кастомные поля форм (fields)

Система полей позволяет заменить стандартные компоненты форм на собственные. Есть три уровня переопределения с четким приоритетом.

### Приоритет разрешения

При определении, какой компонент использовать для поля, PRADA проверяет в следующем порядке:

1. **byModelField** -- конкретное поле конкретной модели (наивысший приоритет)
2. **byName** -- поле с заданным именем (во всех моделях)
3. **byType** -- все поля заданного типа (наименьший приоритет)

Если ни один override не найден, используется встроенный компонент.

### Интерфейс FieldComponentProps

Каждый кастомный компонент поля получает следующие пропсы:

```typescript
interface FieldComponentProps {
  /** Имя поля (используется для register) */
  name: string
  /** Метка поля для отображения */
  label: string
  /** Метаданные поля из схемы */
  field: PradaField
  /** Метаданные модели из схемы */
  model: PradaModel
  /** Функция register из react-hook-form */
  register: UseFormRegister<Record<string, unknown>>
  /** Текст ошибки валидации */
  error?: string
  /** Обязательное ли поле */
  required?: boolean
  /** Текущее значение поля */
  value?: unknown
  /** Режим редактирования (true) или создания (false) */
  isEdit?: boolean
}
```

### Переопределение по типу (byType)

Заменяет компонент для всех полей заданного типа. Доступные типы: `string`, `number`, `boolean`, `date`, `enum`, `json`, `bigint`, `decimal`, `bytes`.

```tsx
import type { FieldComponentProps } from '@blysspeak/prada-ui'

function RichTextEditor({ name, label, register, error }: FieldComponentProps) {
  return (
    <div>
      <label>{label}</label>
      <textarea {...register(name)} className="rich-editor" />
      {error && <span className="error">{error}</span>}
    </div>
  )
}

const config: PradaConfig = {
  fields: {
    byType: {
      string: RichTextEditor,  // Все строковые поля используют RichTextEditor
    }
  }
}
```

### Переопределение по имени (byName)

Заменяет компонент для всех полей с заданным именем, независимо от модели.

```tsx
function ColorPicker({ name, label, register, error, value }: FieldComponentProps) {
  return (
    <div>
      <label>{label}</label>
      <input type="color" {...register(name)} defaultValue={value as string} />
      {error && <span className="error">{error}</span>}
    </div>
  )
}

const config: PradaConfig = {
  fields: {
    byName: {
      color: ColorPicker,       // Все поля с именем "color" в любой модели
      avatar: AvatarUpload,     // Все поля с именем "avatar"
    }
  }
}
```

### Переопределение по модели и полю (byModelField)

Самый точный уровень. Заменяет компонент для конкретного поля конкретной модели.

```tsx
function UserAvatarUpload(props: FieldComponentProps) {
  // Компонент загрузки аватара специально для модели User
  return <div>...</div>
}

const config: PradaConfig = {
  fields: {
    byModelField: {
      User: {
        avatar: UserAvatarUpload,    // Только поле avatar в модели User
        bio: MarkdownEditor,         // Только поле bio в модели User
      },
      Product: {
        description: RichTextEditor  // Только description в модели Product
      }
    }
  }
}
```

### Комбинирование уровней

Все три уровня можно использовать одновременно:

```tsx
const config: PradaConfig = {
  fields: {
    byType: {
      json: JsonEditor,        // Все JSON-поля
      date: DatePicker,        // Все поля даты
    },
    byName: {
      email: EmailInput,       // Все поля "email" в любой модели
    },
    byModelField: {
      User: {
        email: VerifiedEmailInput  // Только email в User (перекрывает byName)
      }
    }
  }
}
```

В этом примере:
- Поле `email` в модели `User` использует `VerifiedEmailInput` (byModelField)
- Поле `email` в модели `Order` использует `EmailInput` (byName)
- Поле `metadata` типа `json` в любой модели использует `JsonEditor` (byType)

## Кастомные ячейки таблиц (cells)

Система ячеек работает аналогично полям, но отвечает за отображение данных в таблице списка.

### Интерфейс CellRendererProps

```typescript
interface CellRendererProps {
  /** Значение ячейки */
  value: unknown
  /** Метаданные поля из схемы */
  field: PradaField
  /** Метаданные модели из схемы */
  model: PradaModel
  /** Полная запись (вся строка таблицы) */
  row: Record<string, unknown>
}
```

### Приоритет разрешения

Такой же, как у полей: `byModelField` -> `byName` -> `byType` -> default.

### Пример

```tsx
import type { CellRendererProps } from '@blysspeak/prada-ui'

function StatusBadge({ value }: CellRendererProps) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <span className={`px-2 py-1 rounded ${colors[value as string] ?? 'bg-gray-100'}`}>
      {String(value)}
    </span>
  )
}

function AvatarCell({ value }: CellRendererProps) {
  return value
    ? <img src={String(value)} className="w-8 h-8 rounded-full" />
    : <div className="w-8 h-8 rounded-full bg-gray-200" />
}

function PriceCell({ value }: CellRendererProps) {
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(Number(value))

  return <span className="font-mono">{formatted}</span>
}

const config: PradaConfig = {
  cells: {
    byType: {
      boolean: ({ value }) => (
        <span>{value ? 'Да' : 'Нет'}</span>
      ),
    },
    byName: {
      status: StatusBadge,
      avatar: AvatarCell,
    },
    byModelField: {
      Product: {
        price: PriceCell,
      }
    }
  }
}
```

## Замена страниц (pages)

Можно полностью заменить встроенные страницы на собственные компоненты.

### Доступные страницы

```typescript
interface PageOverrides {
  /** Главная страница (дашборд) */
  dashboard?: ComponentType
  /** Список записей модели */
  modelList?: ComponentType<{ model: PradaModel }>
  /** Форма создания/редактирования */
  modelForm?: ComponentType<{ model: PradaModel; id?: string }>
  /** Детальный просмотр записи */
  modelView?: ComponentType<{ model: PradaModel; id: string }>
  /** Страница входа */
  login?: ComponentType
}
```

### Пример замены дашборда

```tsx
import { useModelList } from '@blysspeak/prada-ui'

function CustomDashboard() {
  const { data: users, meta: usersMeta } = useModelList('User')
  const { data: orders, meta: ordersMeta } = useModelList('Order', {
    sort: 'createdAt',
    order: 'desc',
    limit: 5
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Панель управления</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded">
          <div className="text-3xl font-bold">{usersMeta.total}</div>
          <div className="text-gray-600">Пользователей</div>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <div className="text-3xl font-bold">{ordersMeta.total}</div>
          <div className="text-gray-600">Заказов</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Последние заказы</h2>
      <ul>
        {orders.map((order: any) => (
          <li key={order.id}>{order.id} -- {order.status}</li>
        ))}
      </ul>
    </div>
  )
}

const config: PradaConfig = {
  pages: {
    dashboard: CustomDashboard,
  }
}
```

## Система слотов (slots)

Слоты позволяют вставлять дополнительные компоненты в фиксированные позиции на страницах, не заменяя страницу целиком.

### Доступные слоты

```typescript
interface SlotOverrides {
  /** Замена боковой панели целиком */
  sidebar?: ComponentType
  /** Над таблицей на странице списка */
  listHeader?: ComponentType<{ model: PradaModel }>
  /** Под таблицей на странице списка */
  listFooter?: ComponentType<{ model: PradaModel }>
  /** Над формой на странице создания/редактирования */
  formHeader?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  /** Под формой на странице создания/редактирования */
  formFooter?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  /** Над детальным просмотром записи */
  viewHeader?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  /** Под детальным просмотром записи */
  viewFooter?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  /** Замена верхней панели (header) */
  header?: ComponentType
}
```

### Пример

```tsx
import type { PradaModel } from '@blysspeak/prada-ui'

function OrderListWarning({ model }: { model: PradaModel }) {
  if (model.name !== 'Order') return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
      Внимание: удаление заказа не отменяет связанные платежи.
    </div>
  )
}

function FormGuidance({ model, isEdit }: { model: PradaModel; isEdit: boolean }) {
  return (
    <div className="text-sm text-gray-500 mb-4">
      {isEdit
        ? `Редактирование записи ${model.name}`
        : `Создание новой записи ${model.name}`
      }
    </div>
  )
}

function ViewActions({ model, record }: { model: PradaModel; record: Record<string, unknown> }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={() => exportToPdf(record)}>Экспорт в PDF</button>
      <button onClick={() => sendEmail(record)}>Отправить на email</button>
    </div>
  )
}

const config: PradaConfig = {
  slots: {
    listHeader: OrderListWarning,
    formHeader: FormGuidance,
    viewFooter: ViewActions,
  }
}
```

## Кастомные маршруты (routes)

Можно добавить собственные страницы в приложение. Маршруты интегрируются в систему навигации React Router и опционально добавляются в боковую панель.

### Интерфейс CustomRoute

```typescript
interface CustomRoute {
  /** Путь маршрута (относительно базового URL) */
  path: string
  /** React-компонент страницы */
  element: ComponentType
  /** Опционально: добавить пункт в боковую панель */
  sidebar?: {
    label: string
    icon?: ComponentType<{ size?: number }>
    section?: 'top' | 'bottom'
  }
}
```

### Пример

```tsx
import { useModelList } from '@blysspeak/prada-ui'
import { BarChart3, Settings } from 'lucide-react'

function AnalyticsPage() {
  const { data: orders } = useModelList('Order', { limit: 100 })
  const total = orders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Аналитика</h1>
      <p>Общая сумма заказов: {total} руб.</p>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>
      <p>Пользовательские настройки приложения.</p>
    </div>
  )
}

const config: PradaConfig = {
  routes: [
    {
      path: '/analytics',
      element: AnalyticsPage,
      sidebar: {
        label: 'Аналитика',
        icon: BarChart3,
        section: 'top',
      }
    },
    {
      path: '/settings',
      element: SettingsPage,
      sidebar: {
        label: 'Настройки',
        icon: Settings,
        section: 'bottom',
      }
    }
  ]
}
```

Кастомные маршруты монтируются внутри защищенной зоны (требуют авторизации) и отображаются внутри основного Layout с боковой панелью.

## Настройка боковой панели (sidebar)

### Интерфейс SidebarOverrides

```typescript
interface SidebarOverrides {
  /** Дополнительные пункты меню (после списка моделей) */
  extraItems?: SidebarItem[]
  /** Скрыть модели из бокового меню */
  hiddenModels?: string[]
  /** Кастомные названия моделей */
  modelLabels?: Record<string, string>
  /** Кастомный компонент логотипа */
  logo?: ComponentType
}

interface SidebarItem {
  label: string
  path: string
  icon?: ComponentType<{ size?: number }>
}
```

### Пример

```tsx
import { Users, ShoppingCart } from 'lucide-react'

function CustomLogo() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <img src="/logo.svg" alt="Logo" className="h-8" />
      <span className="font-bold">My Admin</span>
    </div>
  )
}

const config: PradaConfig = {
  sidebar: {
    logo: CustomLogo,
    // Переименовать модели в меню
    modelLabels: {
      User: 'Пользователи',
      Order: 'Заказы',
      Product: 'Товары',
    },
    // Скрыть служебные модели
    hiddenModels: ['Session', 'AuditLog', '_prisma_migrations'],
    // Дополнительные пункты меню
    extraItems: [
      { label: 'Документация', path: '/docs', icon: undefined },
    ]
  }
}
```

## Настройка действий (actions)

Управление действиями в таблице (кнопки в строке).

### Интерфейс ActionOverrides

```typescript
interface ActionOverrides {
  /** Кастомные действия для строки таблицы (по моделям) */
  rowActions?: Record<
    string,
    ComponentType<{ row: Record<string, unknown>; model: PradaModel }>[]
  >
  /** Скрыть стандартные действия (по моделям) */
  hideActions?: Record<string, ('view' | 'edit' | 'delete')[]>
}
```

### Пример

```tsx
import type { PradaModel } from '@blysspeak/prada-ui'

function CloneOrderButton({ row, model }: { row: Record<string, unknown>; model: PradaModel }) {
  const { mutate: create } = useModelCreate('Order')

  const handleClone = () => {
    const { id, createdAt, updatedAt, ...data } = row
    create(data)
  }

  return (
    <button onClick={handleClone} className="text-blue-600 hover:underline">
      Клонировать
    </button>
  )
}

function SendInvoiceButton({ row }: { row: Record<string, unknown>; model: PradaModel }) {
  return (
    <button onClick={() => sendInvoice(row.id)} className="text-green-600 hover:underline">
      Счет
    </button>
  )
}

const config: PradaConfig = {
  actions: {
    rowActions: {
      Order: [CloneOrderButton, SendInvoiceButton],
    },
    hideActions: {
      // Запретить удаление пользователей из UI
      User: ['delete'],
      // Только просмотр для логов
      AuditLog: ['edit', 'delete'],
    }
  }
}
```

## Полный пример

Пример конфигурации, использующей все секции:

```tsx
import { App } from '@blysspeak/prada-ui'
import type { PradaConfig, FieldComponentProps, CellRendererProps } from '@blysspeak/prada-ui'
import { useModelList, useModelCreate } from '@blysspeak/prada-ui'
import { BarChart3, Settings, Upload } from 'lucide-react'

// --- Кастомные компоненты полей ---

function ImageUpload({ name, label, register, value }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      {value && <img src={String(value)} className="w-20 h-20 object-cover rounded" />}
      <input type="file" accept="image/*" onChange={(e) => {/* upload logic */}} />
      <input type="hidden" {...register(name)} />
    </div>
  )
}

function MarkdownEditor({ name, label, register, error, value }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      <textarea
        {...register(name)}
        defaultValue={value as string}
        className="w-full h-40 font-mono text-sm border rounded p-2"
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}

// --- Кастомные компоненты ячеек ---

function StatusBadge({ value }: CellRendererProps) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[String(value)] ?? 'bg-gray-100'}`}>
      {String(value)}
    </span>
  )
}

function ThumbnailCell({ value }: CellRendererProps) {
  return value
    ? <img src={String(value)} className="w-8 h-8 rounded object-cover" />
    : <div className="w-8 h-8 rounded bg-gray-200" />
}

// --- Кастомные страницы ---

function AnalyticsPage() {
  const { data, meta } = useModelList('Order', { limit: 1 })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Аналитика</h1>
      <p>Всего заказов: {meta.total}</p>
    </div>
  )
}

function BulkImportPage() {
  const { mutateAsync: create } = useModelCreate('Product')

  const handleImport = async (items: any[]) => {
    for (const item of items) {
      await create(item)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Массовый импорт</h1>
      {/* Upload CSV / JSON UI */}
    </div>
  )
}

// --- Кастомный логотип ---

function Logo() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b">
      <span className="text-xl font-bold">MyShop Admin</span>
    </div>
  )
}

// --- Сборка конфигурации ---

const config: PradaConfig = {
  fields: {
    byType: {
      json: MarkdownEditor,
    },
    byName: {
      avatar: ImageUpload,
      thumbnail: ImageUpload,
    },
    byModelField: {
      Post: {
        content: MarkdownEditor,
      }
    }
  },

  cells: {
    byName: {
      status: StatusBadge,
      avatar: ThumbnailCell,
      thumbnail: ThumbnailCell,
    }
  },

  pages: {
    dashboard: AnalyticsPage,
  },

  slots: {
    listHeader: ({ model }) => {
      if (model.name !== 'Order') return null
      return (
        <div className="bg-blue-50 p-3 rounded mb-4">
          Для массового создания заказов используйте раздел "Импорт".
        </div>
      )
    },
  },

  routes: [
    {
      path: '/analytics',
      element: AnalyticsPage,
      sidebar: { label: 'Аналитика', icon: BarChart3, section: 'top' },
    },
    {
      path: '/import',
      element: BulkImportPage,
      sidebar: { label: 'Импорт', icon: Upload, section: 'bottom' },
    },
  ],

  sidebar: {
    logo: Logo,
    modelLabels: {
      User: 'Пользователи',
      Order: 'Заказы',
      Product: 'Товары',
      Post: 'Статьи',
    },
    hiddenModels: ['Session', 'Migration'],
  },

  actions: {
    hideActions: {
      User: ['delete'],
      AuditLog: ['edit', 'delete'],
    }
  }
}

// --- Точка входа ---

export default function AdminApp() {
  return <App config={config} />
}
```

## Доступ к конфигурации из компонентов

Внутри кастомных компонентов можно получить доступ к текущей конфигурации через хук `usePrada()`:

```tsx
import { usePrada } from '@blysspeak/prada-ui'

function MyComponent() {
  const config = usePrada()
  // config.fields, config.cells, config.pages, ...
}
```

## Хуки для поиска компонентов

PRADA экспортирует хуки `useFieldComponent` и `useCellRenderer`, которые реализуют логику приоритетного разрешения компонентов:

```tsx
import { useFieldComponent, useCellRenderer } from '@blysspeak/prada-ui'

function MyForm({ model, field }) {
  const FieldComp = useFieldComponent(model.name, field.name, field.type)
  // FieldComp -- разрешенный компонент с учетом приоритетов
}

function MyTable({ model, field, value, row }) {
  const CellComp = useCellRenderer(model.name, field.name, field.type)
  // CellComp -- разрешенный рендерер ячейки
}
```
