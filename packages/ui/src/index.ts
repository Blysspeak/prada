/**
 * @blysspeak/prada-ui
 *
 * React components and pages for PRADA admin panel.
 *
 * This package provides:
 * - Ready-to-use pages (LoginPage, DashboardPage, ModelListPage, etc.)
 * - Reusable components (DataTable, DynamicForm, Layout, etc.)
 * - Form fields (TextField, NumberField, BooleanField, etc.)
 * - Providers (AuthProvider, SchemaProvider, SettingsProvider, etc.)
 * - Hooks (useAuth, useSchema, useSettings, useTranslation)
 * - API client for PRADA backend
 * - Utility functions (cn, formatDate, formatValue)
 *
 * @example
 * ```tsx
 * // Use individual components
 * import { DataTable, DynamicForm, Layout } from '@blysspeak/prada-ui'
 *
 * // Use ready pages
 * import { ModelListPage, LoginPage } from '@blysspeak/prada-ui'
 *
 * // Use hooks
 * import { useSchema, useAuth, useSettings } from '@blysspeak/prada-ui'
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// PAGES - Ready-to-use page components
// =============================================================================

export {
  LoginPage,
  SetupPage,
  DashboardPage,
  ModelListPage,
  ModelFormPage,
  ModelViewPage
} from './pages'

// =============================================================================
// COMPONENTS - Reusable UI components
// =============================================================================

// Data display
export { DataTable, Pagination } from './components/DataTable'

// Forms
export { DynamicForm } from './components/Form'

// Layout
export { Layout, Sidebar } from './components/Layout'

// Settings
export { SettingsModal, AnimatedThemeToggler } from './components/Settings'

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
  JsonField
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

// Auth and schema hooks are exported from providers above
// Additional utility hooks:
export { useTranslation, pluralize } from './i18n/useTranslation'

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

// =============================================================================
// I18N - Internationalization
// =============================================================================

export {
  translations,
  type TranslationKey
} from './i18n/translations'
