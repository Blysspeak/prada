/**
 * useCellRenderer hook
 *
 * Resolves the correct cell renderer for a given model+field combination.
 * Resolution order: model+field → field name → field type → null (use default)
 */

import { usePrada } from './PradaProvider'
import type { PradaModel, PradaField } from '../types'
import type { CellRenderer } from './types'

export function useCellRenderer(model: PradaModel, field: PradaField): CellRenderer | null {
  const { cells } = usePrada()
  if (!cells) return null

  return cells.byModelField?.[model.name]?.[field.name]
    ?? cells.byName?.[field.name]
    ?? cells.byType?.[field.type]
    ?? null
}
