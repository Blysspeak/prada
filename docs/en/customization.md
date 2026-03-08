# UI Customization

PRADA's UI customization system is built around a single `PradaConfig` object that you pass to the `<App>` component. It lets you override form fields, table cells, entire pages, inject components into layout slots, add custom routes, and reshape the sidebar -- all without forking the UI.

## PradaConfig Overview

```typescript
import { App } from '@blysspeak/prada-ui'
import type { PradaConfig } from '@blysspeak/prada-ui'

const config: PradaConfig = {
  fields: { ... },    // Custom form field components
  cells: { ... },     // Custom table cell renderers
  pages: { ... },     // Replace entire pages
  slots: { ... },     // Inject components into page sections
  routes: [ ... ],    // Add custom routes
  sidebar: { ... },   // Customize the sidebar
  actions: { ... },   // Customize table row actions
}

function MyAdmin() {
  return <App config={config} />
}
```

Every property is optional. Start with an empty config and add overrides as needed.

## Field Overrides

Field overrides replace the default form input for a given field. There are three resolution levels, checked in this order:

1. **byModelField** -- specific model + field name (highest priority)
2. **byName** -- field name across all models
3. **byType** -- field type across all models (lowest priority)

If no override matches, PRADA uses its built-in field component.

### FieldComponentProps

Every custom field component receives these props:

```typescript
interface FieldComponentProps {
  name: string                                    // Field name (e.g. "email")
  label: string                                   // Display label
  field: PradaField                               // Full field metadata
  model: PradaModel                               // Parent model metadata
  register: UseFormRegister<Record<string, unknown>>  // react-hook-form register
  error?: string                                  // Validation error message
  required?: boolean                              // Whether the field is required
  value?: unknown                                 // Current field value
  isEdit?: boolean                                // true when editing, false when creating
}
```

### Example: Override by Type

Replace the default input for all `date` fields with a custom date picker:

```tsx
import type { FieldComponentProps } from '@blysspeak/prada-ui'

function MyDatePicker({ name, label, register, error, required }: FieldComponentProps) {
  return (
    <div>
      <label>{label}</label>
      <input type="date" {...register(name, { required })} />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  )
}

const config: PradaConfig = {
  fields: {
    byType: {
      date: MyDatePicker
    }
  }
}
```

### Example: Override by Name

Replace the input for any field named `avatar` in any model:

```tsx
function AvatarUpload({ name, register, value }: FieldComponentProps) {
  return (
    <div>
      {value && <img src={String(value)} alt="avatar" width={64} />}
      <input type="url" {...register(name)} placeholder="Image URL" />
    </div>
  )
}

const config: PradaConfig = {
  fields: {
    byName: {
      avatar: AvatarUpload
    }
  }
}
```

### Example: Override by Model + Field

Replace the input for the `bio` field only on the `User` model:

```tsx
function RichTextEditor({ name, register, value }: FieldComponentProps) {
  return <textarea {...register(name)} defaultValue={String(value || '')} rows={10} />
}

const config: PradaConfig = {
  fields: {
    byModelField: {
      User: {
        bio: RichTextEditor
      }
    }
  }
}
```

### Resolution Priority

When multiple overrides could match, the most specific one wins:

```typescript
const config: PradaConfig = {
  fields: {
    byType: { string: GeneralStringField },       // lowest priority
    byName: { title: TitleField },                 // medium priority
    byModelField: { Post: { title: PostTitle } }   // highest priority
  }
}
```

For `Post.title`, PRADA uses `PostTitle`. For `Comment.title`, it uses `TitleField`. For `User.email` (a string with no name or model override), it uses `GeneralStringField`.

## Cell Overrides

Cell overrides work exactly like field overrides but control how values are rendered in table columns instead of form inputs.

### CellRendererProps

```typescript
interface CellRendererProps {
  value: unknown                    // The cell value
  field: PradaField                 // Field metadata
  model: PradaModel                 // Model metadata
  row: Record<string, unknown>      // The entire row data
}
```

### Example: Custom Cell Renderers

```tsx
import type { CellRendererProps } from '@blysspeak/prada-ui'

function StatusBadge({ value }: CellRendererProps) {
  const color = value === 'active' ? 'green' : 'gray'
  return <span style={{ color }}>{String(value)}</span>
}

function AvatarCell({ value }: CellRendererProps) {
  if (!value) return <span>--</span>
  return <img src={String(value)} alt="" width={32} height={32} className="rounded-full" />
}

function CurrencyCell({ value }: CellRendererProps) {
  return <span>${Number(value).toFixed(2)}</span>
}

const config: PradaConfig = {
  cells: {
    byType: {
      number: CurrencyCell
    },
    byName: {
      status: StatusBadge,
      avatar: AvatarCell
    },
    byModelField: {
      Order: {
        total: ({ value }) => <strong>${Number(value).toFixed(2)}</strong>
      }
    }
  }
}
```

## Page Overrides

Replace entire pages with your own components:

```typescript
interface PageOverrides {
  dashboard?: ComponentType
  modelList?: ComponentType<{ model: PradaModel }>
  modelForm?: ComponentType<{ model: PradaModel; id?: string }>
  modelView?: ComponentType<{ model: PradaModel; id: string }>
  login?: ComponentType
}
```

### Example: Custom Dashboard

```tsx
import { useModelList } from '@blysspeak/prada-ui'

function CustomDashboard() {
  const { data: users, meta: userMeta } = useModelList('User')
  const { data: orders, meta: orderMeta } = useModelList('Order')

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h2>Users</h2>
          <p className="text-3xl">{userMeta.total}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2>Orders</h2>
          <p className="text-3xl">{orderMeta.total}</p>
        </div>
      </div>
    </div>
  )
}

const config: PradaConfig = {
  pages: {
    dashboard: CustomDashboard
  }
}
```

## Slot System

Slots let you inject components into specific locations within the built-in pages without replacing the entire page.

```typescript
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
```

### Example: Add Export Button Above List

```tsx
function ExportButton({ model }: { model: PradaModel }) {
  const handleExport = () => {
    window.open(`/admin/api/${model.name}?limit=10000&format=csv`)
  }

  return (
    <div className="flex justify-end p-2">
      <button onClick={handleExport} className="px-4 py-2 bg-blue-500 text-white rounded">
        Export {model.name}
      </button>
    </div>
  )
}

const config: PradaConfig = {
  slots: {
    listHeader: ExportButton
  }
}
```

### Example: Custom Sidebar

```tsx
function CustomSidebar() {
  return (
    <nav className="p-4">
      <h2 className="text-lg font-bold mb-4">My App</h2>
      <a href="/admin/">Dashboard</a>
      <a href="/admin/models/User">Users</a>
      <a href="/admin/models/Order">Orders</a>
    </nav>
  )
}

const config: PradaConfig = {
  slots: {
    sidebar: CustomSidebar
  }
}
```

## Custom Routes

Add entirely new pages to the admin panel. Routes are rendered inside the authenticated layout, so they have access to all PRADA providers and hooks.

```typescript
interface CustomRoute {
  path: string
  element: ComponentType
  sidebar?: {
    label: string
    icon?: ComponentType<{ size?: number }>
    section?: 'top' | 'bottom'
  }
}
```

### Example: Analytics Page with Sidebar Link

```tsx
import { useModelList } from '@blysspeak/prada-ui'
import { BarChart3 } from 'lucide-react'

function AnalyticsPage() {
  const { data: orders } = useModelList('Order', {
    filters: { status: 'completed' },
    limit: 100
  })

  const total = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p>Completed orders: {orders.length}</p>
      <p>Total revenue: ${total.toFixed(2)}</p>
    </div>
  )
}

const config: PradaConfig = {
  routes: [
    {
      path: '/analytics',
      element: AnalyticsPage,
      sidebar: {
        label: 'Analytics',
        icon: BarChart3,
        section: 'top'
      }
    }
  ]
}
```

The `sidebar` property is optional. If provided, PRADA automatically adds a navigation item to the sidebar. The `section` controls whether it appears at the top or bottom of the sidebar.

## Sidebar Overrides

Fine-tune the sidebar without replacing it entirely:

```typescript
interface SidebarOverrides {
  extraItems?: SidebarItem[]
  hiddenModels?: string[]
  modelLabels?: Record<string, string>
  logo?: ComponentType
}
```

### Example

```tsx
const config: PradaConfig = {
  sidebar: {
    // Rename models in the sidebar
    modelLabels: {
      User: 'Team Members',
      BlogPost: 'Articles'
    },
    // Hide internal models
    hiddenModels: ['Session', 'Migration', '_prisma_migrations'],
    // Add extra nav items
    extraItems: [
      { label: 'Documentation', path: '/docs', icon: BookIcon }
    ],
    // Custom logo
    logo: () => <img src="/logo.svg" alt="My App" className="h-8" />
  }
}
```

## Action Overrides

Customize the actions column in data tables:

```typescript
interface ActionOverrides {
  rowActions?: Record<string, ComponentType<{ row: Record<string, unknown>; model: PradaModel }>[]>
  hideActions?: Record<string, ('view' | 'edit' | 'delete')[]>
}
```

### Example: Add Custom Row Action and Hide Delete

```tsx
function SendEmailAction({ row }: { row: Record<string, unknown>; model: PradaModel }) {
  return (
    <button onClick={() => sendEmail(String(row.email))}>
      Send Email
    </button>
  )
}

const config: PradaConfig = {
  actions: {
    rowActions: {
      User: [SendEmailAction]
    },
    hideActions: {
      User: ['delete'],      // Hide delete button for users
      AuditLog: ['edit', 'delete']  // Make audit logs read-only
    }
  }
}
```

## Full Example

Here is a complete configuration combining multiple customization features:

```tsx
import { App } from '@blysspeak/prada-ui'
import type { PradaConfig, FieldComponentProps, CellRendererProps } from '@blysspeak/prada-ui'
import { useModelList } from '@blysspeak/prada-ui'
import { BarChart3, Settings } from 'lucide-react'

// Custom field: rich text editor for "description" fields
function RichText({ name, register, value }: FieldComponentProps) {
  return <textarea {...register(name)} defaultValue={String(value || '')} rows={8} />
}

// Custom cell: colored status badge
function StatusBadge({ value }: CellRendererProps) {
  const colors: Record<string, string> = {
    active: '#22c55e', pending: '#eab308', inactive: '#ef4444'
  }
  return (
    <span style={{ color: colors[String(value)] || '#6b7280' }}>
      {String(value)}
    </span>
  )
}

// Custom page: analytics dashboard
function AnalyticsPage() {
  const { data, meta } = useModelList('Order', { sort: 'createdAt', order: 'desc' })
  return (
    <div className="p-6">
      <h1>Analytics</h1>
      <p>Total orders: {meta.total}</p>
    </div>
  )
}

// Custom page: settings
function SettingsPage() {
  return <div className="p-6"><h1>App Settings</h1></div>
}

// Custom dashboard
function Dashboard() {
  const { meta: users } = useModelList('User')
  const { meta: orders } = useModelList('Order')
  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      <div className="p-4 rounded bg-white shadow">
        <h3>Users</h3>
        <p className="text-3xl">{users.total}</p>
      </div>
      <div className="p-4 rounded bg-white shadow">
        <h3>Orders</h3>
        <p className="text-3xl">{orders.total}</p>
      </div>
    </div>
  )
}

const config: PradaConfig = {
  // Form fields
  fields: {
    byName: { description: RichText },
    byModelField: {
      User: { bio: RichText }
    }
  },

  // Table cells
  cells: {
    byName: { status: StatusBadge }
  },

  // Replace dashboard
  pages: {
    dashboard: Dashboard
  },

  // Inject header into list pages
  slots: {
    listHeader: ({ model }) => (
      <div className="p-2 text-sm text-gray-500">
        Managing: {model.name}
      </div>
    )
  },

  // Custom routes with sidebar items
  routes: [
    {
      path: '/analytics',
      element: AnalyticsPage,
      sidebar: { label: 'Analytics', icon: BarChart3, section: 'top' }
    },
    {
      path: '/settings',
      element: SettingsPage,
      sidebar: { label: 'Settings', icon: Settings, section: 'bottom' }
    }
  ],

  // Sidebar customization
  sidebar: {
    modelLabels: { User: 'Team', BlogPost: 'Articles' },
    hiddenModels: ['Session'],
    logo: () => <span className="text-xl font-bold">MyApp</span>
  },

  // Actions
  actions: {
    hideActions: {
      AuditLog: ['edit', 'delete']
    }
  }
}

export default function AdminApp() {
  return <App config={config} />
}
```
