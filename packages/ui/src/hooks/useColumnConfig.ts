import { useState, useCallback, useMemo } from 'react'
import type { PradaField } from '@/types'

interface ColumnConfig {
  visible: string[]    // field names that are visible (all if empty)
  order: string[]      // field names in custom order (original if empty)
}

const STORAGE_PREFIX = 'prada_columns_'

function loadConfig(modelName: string): ColumnConfig {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${modelName}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        visible: Array.isArray(parsed.visible) ? parsed.visible : [],
        order: Array.isArray(parsed.order) ? parsed.order : []
      }
    }
  } catch {
    // ignore
  }
  return { visible: [], order: [] }
}

function saveConfig(modelName: string, config: ColumnConfig) {
  localStorage.setItem(`${STORAGE_PREFIX}${modelName}`, JSON.stringify(config))
}

export function useColumnConfig(modelName: string) {
  const [config, setConfig] = useState<ColumnConfig>(() => loadConfig(modelName))

  const updateConfig = useCallback((newConfig: ColumnConfig) => {
    setConfig(newConfig)
    saveConfig(modelName, newConfig)
  }, [modelName])

  const isColumnVisible = useCallback((fieldName: string): boolean => {
    if (config.visible.length === 0) return true
    return config.visible.includes(fieldName)
  }, [config.visible])

  const toggleColumn = useCallback((fieldName: string) => {
    setConfig(prev => {
      let newVisible: string[]
      if (prev.visible.length === 0) {
        // Currently all visible — we need to know all fields, but we don't here.
        // So toggling from "all visible" means we can't remove one without knowing all.
        // We'll handle this by storing all-except-this when visible is empty.
        // The caller should initialize visible with all field names first.
        newVisible = prev.visible.filter(v => v !== fieldName)
      } else if (prev.visible.includes(fieldName)) {
        newVisible = prev.visible.filter(v => v !== fieldName)
      } else {
        newVisible = [...prev.visible, fieldName]
      }
      const newConfig = { ...prev, visible: newVisible }
      saveConfig(modelName, newConfig)
      return newConfig
    })
  }, [modelName])

  const toggleColumnWithAllFields = useCallback((fieldName: string, allFieldNames: string[]) => {
    setConfig(prev => {
      let currentVisible = prev.visible.length === 0 ? [...allFieldNames] : [...prev.visible]
      if (currentVisible.includes(fieldName)) {
        currentVisible = currentVisible.filter(v => v !== fieldName)
      } else {
        currentVisible = [...currentVisible, fieldName]
      }
      // If all are visible again, store empty array (meaning "all")
      const newVisible = currentVisible.length === allFieldNames.length ? [] : currentVisible
      const newConfig = { ...prev, visible: newVisible }
      saveConfig(modelName, newConfig)
      return newConfig
    })
  }, [modelName])

  const reorderColumns = useCallback((newOrder: string[]) => {
    const newConfig = { ...config, order: newOrder }
    updateConfig(newConfig)
  }, [config, updateConfig])

  const resetColumns = useCallback(() => {
    updateConfig({ visible: [], order: [] })
  }, [updateConfig])

  const getOrderedFields = useCallback((fields: PradaField[]): PradaField[] => {
    let result = [...fields]

    // Apply visibility filter
    if (config.visible.length > 0) {
      result = result.filter(f => config.visible.includes(f.name))
    }

    // Apply custom order
    if (config.order.length > 0) {
      result.sort((a, b) => {
        const aIdx = config.order.indexOf(a.name)
        const bIdx = config.order.indexOf(b.name)
        // Fields not in the order array go to the end
        const aOrder = aIdx === -1 ? config.order.length : aIdx
        const bOrder = bIdx === -1 ? config.order.length : bIdx
        return aOrder - bOrder
      })
    }

    return result
  }, [config.visible, config.order])

  return useMemo(() => ({
    config,
    isColumnVisible,
    toggleColumn,
    toggleColumnWithAllFields,
    reorderColumns,
    resetColumns,
    getOrderedFields
  }), [config, isColumnVisible, toggleColumn, toggleColumnWithAllFields, reorderColumns, resetColumns, getOrderedFields])
}

export type ColumnConfigReturn = ReturnType<typeof useColumnConfig>
