/**
 * @blysspeak/prada-ui
 *
 * React components, hooks, and customization system for PRADA admin panel.
 *
 * @example
 * ```tsx
 * // Quick start — drop-in admin with customization
 * import { App } from '@blysspeak/prada-ui'
 *
 * <App config={{
 *   fields: { byModelField: { User: { avatar: AvatarUpload } } },
 *   routes: [{ path: '/analytics', element: AnalyticsPage }],
 *   sidebar: { modelLabels: { User: 'Team' } },
 * }} />
 *
 * // Use data hooks in custom pages
 * import { useModelList, useModelCreate } from '@blysspeak/prada-ui'
 *
 * function MyPage() {
 *   const { data, meta } = useModelList('Order', { sort: 'createdAt' })
 *   const { mutate } = useModelCreate('Order')
 * }
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// APP - Main entry point (accepts PradaConfig)
// =============================================================================

export { App, type AppProps } from './App'

// =============================================================================
// CUSTOMIZATION - Plugin/extension system
// =============================================================================

export {
  PradaProvider,
  usePrada,
  useFieldComponent,
  useCellRenderer,
  type PradaConfig,
  type FieldComponentProps,
  type FieldComponent,
  type FieldOverrides,
  type CellRendererProps,
  type CellRenderer,
  type CellOverrides,
  type PageOverrides,
  type SlotOverrides,
  type CustomRoute,
  type SidebarItem,
  type SidebarOverrides,
  type ActionOverrides
} from './customization'

// =============================================================================
// DATA HOOKS - React Query hooks for CRUD operations
// =============================================================================

export {
  useModelList,
  useModelRecord,
  useModelCreate,
  useModelUpdate,
  useModelDelete,
  type UseModelListParams
} from './hooks/useModelData'

// =============================================================================
// PAGES - Ready-to-use page components
// =============================================================================

export {
  LoginPage,
  SetupPage,
  DashboardPage,
  ModelListPage,
  ModelFormPage,
  ModelViewPage,
  AuditLogPage
} from './pages'

// =============================================================================
// COMPONENTS - Reusable UI components
// =============================================================================

// Data display
export { DataTable, Pagination } from './components/DataTable'
export { CellValue } from './components/DataTable/CellValue'
export { ColumnPicker } from './components/DataTable/ColumnPicker'
export { ExportButton } from './components/DataTable/ExportButton'
export { InlineEditor } from './components/DataTable/InlineEditor'

// Forms
export { DynamicForm } from './components/Form'
export { FieldRenderer } from './components/Form/FieldRenderer'

// Layout
export { Layout, Sidebar } from './components/Layout'

// Settings
export { SettingsModal, AnimatedThemeToggler } from './components/Settings'

// Filters
export { FilterPanel, FilterField } from './components/Filters'

// Search
export { GlobalSearch, SearchHighlight } from './components/Search'

// Keyboard shortcuts
export { ShortcutsHelp } from './components/KeyboardShortcuts'

// Audit
export { ChangesDiff } from './components/Audit'

// Dashboard
export { ModelStatsCard, QuickActions, RecentActivity } from './components/Dashboard'

// UI primitives
export { BorderBeam } from './components/ui/BorderBeam'
export { MorphingText } from './components/ui/MorphingText'

// =============================================================================
// FORM FIELDS - Individual field components for forms
// =============================================================================

export {
  TextField,
  NumberField,
  BooleanField,
  DateTimeField,
  EnumField,
  JsonField,
  RelationField,
  RelationListField
} from './components/Fields'

// =============================================================================
// PROVIDERS - React context providers
// =============================================================================

export { AuthProvider, useAuth } from './providers/AuthProvider'
export { SchemaProvider, useSchema } from './providers/SchemaProvider'
export {
  SettingsProvider,
  useSettings,
  formatDate,
  type Theme,
  type Language,
  type DateFormat,
  type Settings
} from './providers/SettingsProvider'
export { SetupProvider, useSetup } from './providers/SetupProvider'

// =============================================================================
// HOOKS - Custom React hooks
// =============================================================================

export { useTranslation, pluralize } from './i18n/useTranslation'

// =============================================================================
// HOOKS - Additional custom hooks
// =============================================================================

export { useColumnConfig } from './hooks/useColumnConfig'
export { useGlobalSearch } from './hooks/useGlobalSearch'
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
export { useRelationOptions } from './hooks/useRelationOptions'

// =============================================================================
// API CLIENT - HTTP client for PRADA backend
// =============================================================================

export { api } from './api'

// =============================================================================
// TYPES - TypeScript type definitions
// =============================================================================

export type {
  PradaField,
  PradaModel,
  PradaSchema,
  PradaEnum,
  PaginatedResponse,
  User,
  AuthState
} from './types'

// =============================================================================
// UTILITIES - Helper functions
// =============================================================================

export { cn } from './lib/utils'
export { exportToCSV, exportToJSON } from './lib/export'

// =============================================================================
// I18N - Internationalization
// =============================================================================

export {
  translations,
  type TranslationKey
} from './i18n/translations'
