/**
 * Customization Types
 *
 * Type definitions for PRADA UI customization system.
 * Users can override fields, cells, pages, slots, sidebar, and routes.
 */

import type { ComponentType } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import type { PradaField, PradaModel } from '../types'

// =============================================================================
// FIELD COMPONENTS
// =============================================================================

/** Props passed to every custom field component */
export interface FieldComponentProps {
  name: string
  label: string
  field: PradaField
  model: PradaModel
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
  value?: unknown
  isEdit?: boolean
}

export type FieldComponent = ComponentType<FieldComponentProps>

/**
 * Field overrides with resolution priority:
 * model+field → field name → field type → default
 */
export interface FieldOverrides {
  /** Override by field type: 'string', 'number', 'boolean', 'date', 'enum', 'json' */
  byType?: Record<string, FieldComponent>
  /** Override by field name (applies to ALL models) */
  byName?: Record<string, FieldComponent>
  /** Override by model+field: { User: { avatar: AvatarUpload } } */
  byModelField?: Record<string, Record<string, FieldComponent>>
}

// =============================================================================
// CELL RENDERERS
// =============================================================================

/** Props passed to every custom cell renderer */
export interface CellRendererProps {
  value: unknown
  field: PradaField
  model: PradaModel
  row: Record<string, unknown>
}

export type CellRenderer = ComponentType<CellRendererProps>

/**
 * Cell overrides with same resolution as fields:
 * model+field → field name → field type → default
 */
export interface CellOverrides {
  byType?: Record<string, CellRenderer>
  byName?: Record<string, CellRenderer>
  byModelField?: Record<string, Record<string, CellRenderer>>
}

// =============================================================================
// PAGE OVERRIDES
// =============================================================================

export interface PageOverrides {
  /** Replace the dashboard page */
  dashboard?: ComponentType
  /** Replace model list page */
  modelList?: ComponentType<{ model: PradaModel }>
  /** Replace model form page */
  modelForm?: ComponentType<{ model: PradaModel; id?: string }>
  /** Replace model view page */
  modelView?: ComponentType<{ model: PradaModel; id: string }>
  /** Replace login page */
  login?: ComponentType
}

// =============================================================================
// SLOT OVERRIDES
// =============================================================================

export interface SlotOverrides {
  /** Replace the entire sidebar */
  sidebar?: ComponentType
  /** Render above the data table on list pages */
  listHeader?: ComponentType<{ model: PradaModel }>
  /** Render below the data table on list pages */
  listFooter?: ComponentType<{ model: PradaModel }>
  /** Render above the form on form pages */
  formHeader?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  /** Render below the form on form pages */
  formFooter?: ComponentType<{ model: PradaModel; isEdit: boolean }>
  /** Render above the detail view */
  viewHeader?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  /** Render below the detail view */
  viewFooter?: ComponentType<{ model: PradaModel; record: Record<string, unknown> }>
  /** Custom header component (replaces top bar) */
  header?: ComponentType
}

// =============================================================================
// CUSTOM ROUTES
// =============================================================================

export interface CustomRoute {
  path: string
  element: ComponentType
  /** If provided, adds a sidebar nav item */
  sidebar?: {
    label: string
    icon?: ComponentType<{ size?: number }>
    section?: 'top' | 'bottom'
  }
}

// =============================================================================
// SIDEBAR CUSTOMIZATION
// =============================================================================

export interface SidebarItem {
  label: string
  path: string
  icon?: ComponentType<{ size?: number }>
}

export interface SidebarOverrides {
  /** Extra items added after models */
  extraItems?: SidebarItem[]
  /** Hide specific models from sidebar */
  hiddenModels?: string[]
  /** Custom display names: { User: 'Team Members' } */
  modelLabels?: Record<string, string>
  /** Custom logo component */
  logo?: ComponentType
}

// =============================================================================
// ACTION OVERRIDES
// =============================================================================

export interface ActionOverrides {
  /** Custom row actions per model (added after default view/edit/delete) */
  rowActions?: Record<string, ComponentType<{ row: Record<string, unknown>; model: PradaModel }>[]>
  /** Hide default actions per model */
  hideActions?: Record<string, ('view' | 'edit' | 'delete')[]>
}

// =============================================================================
// MAIN CONFIG
// =============================================================================

/** Main customization config — single entry point for all PRADA UI customization */
export interface PradaConfig {
  /** Custom form field components */
  fields?: FieldOverrides
  /** Custom table cell renderers */
  cells?: CellOverrides
  /** Replace entire pages */
  pages?: PageOverrides
  /** Insert components into page slots */
  slots?: SlotOverrides
  /** Add custom routes */
  routes?: CustomRoute[]
  /** Customize sidebar */
  sidebar?: SidebarOverrides
  /** Customize table actions */
  actions?: ActionOverrides
}
