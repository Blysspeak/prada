/**
 * useFieldComponent hook
 *
 * Resolves the correct field component for a given model+field combination.
 * Resolution order: model+field → field name → field type → null (use default)
 */

import { usePrada } from './PradaProvider'
import type { PradaModel, PradaField } from '../types'
import type { FieldComponent } from './types'

export function useFieldComponent(model: PradaModel, field: PradaField): FieldComponent | null {
  const { fields } = usePrada()
  if (!fields) return null

  return fields.byModelField?.[model.name]?.[field.name]
    ?? fields.byName?.[field.name]
    ?? fields.byType?.[field.type]
    ?? null
}
