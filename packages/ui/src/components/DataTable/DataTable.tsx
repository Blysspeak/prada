import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { usePrada } from '@/customization'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { CellValue } from './CellValue'
import { InlineEditor } from './InlineEditor'
import type { PradaModel } from '@/types'
import type { ColumnConfigReturn } from '@/hooks/useColumnConfig'
import styles from './DataTable.module.css'

interface DataTableProps {
  model: PradaModel
  data: Record<string, unknown>[]
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (row: Record<string, unknown>) => void
  onView?: (row: Record<string, unknown>) => void
  onInlineUpdate?: (row: Record<string, unknown>, fieldName: string, value: unknown) => void
  columnConfig?: ColumnConfigReturn
}

export function DataTable({ model, data, onEdit, onDelete, onView, onInlineUpdate, columnConfig }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const [editingCell, setEditingCell] = useState<{ rowId: string; fieldName: string } | null>(null)
  const { t } = useTranslation()
  const { actions } = usePrada()

  const hiddenActions = actions?.hideActions?.[model.name] ?? []
  const customRowActions = actions?.rowActions?.[model.name] ?? []

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const scalarFields = model.fields.filter(f => f.type !== 'relation')

    // Use columnConfig to get ordered/filtered fields, or show all scalars
    const displayFields = columnConfig
      ? columnConfig.getOrderedFields(scalarFields)
      : scalarFields

    const fieldColumns: ColumnDef<Record<string, unknown>>[] = displayFields
      .map(field => ({
        id: field.name,
        accessorKey: field.name,
        header: ({ column }) => (
          <button
            className={styles.headerButton}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {field.name}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className={styles.sortIcon} />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className={styles.sortIcon} />
            ) : (
              <ArrowUpDown className={styles.sortIcon} />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const idField = model.fields.find(f => f.isId)
          const rowId = idField ? String(row.original[idField.name]) : row.id
          const isEditing = editingCell?.rowId === rowId && editingCell?.fieldName === field.name
          const canEdit = onInlineUpdate && !field.isId && field.type !== 'relation'

          if (isEditing) {
            return (
              <InlineEditor
                field={field}
                value={row.getValue(field.name)}
                onSave={(value) => {
                  onInlineUpdate!(row.original, field.name, value)
                  setEditingCell(null)
                }}
                onCancel={() => setEditingCell(null)}
              />
            )
          }

          return (
            <div
              onDoubleClick={canEdit ? () => setEditingCell({ rowId, fieldName: field.name }) : undefined}
              style={canEdit ? { cursor: 'default' } : undefined}
              title={canEdit ? t('doubleClickToEdit') : undefined}
            >
              <CellValue
                model={model}
                field={field}
                value={row.getValue(field.name)}
                row={row.original}
              />
            </div>
          )
        }
      }))

    const actionsColumn: ColumnDef<Record<string, unknown>> = {
      id: 'actions',
      header: () => t('actions').toUpperCase(),
      cell: ({ row }) => (
        <div className={styles.actions}>
          {onView && !hiddenActions.includes('view') && (
            <button
              className={styles.actionButton}
              onClick={() => onView(row.original)}
              title={t('view')}
            >
              <Eye size={16} />
            </button>
          )}
          {onEdit && !hiddenActions.includes('edit') && (
            <button
              className={styles.actionButton}
              onClick={() => onEdit(row.original)}
              title={t('edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && !hiddenActions.includes('delete') && (
            <button
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={() => onDelete(row.original)}
              title={t('delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
          {customRowActions.map((ActionComponent, i) => (
            <ActionComponent key={i} row={row.original} model={model} />
          ))}
        </div>
      )
    }

    return [...fieldColumns, actionsColumn]
  }, [model, onEdit, onDelete, onView, onInlineUpdate, t, hiddenActions, customRowActions, columnConfig, editingCell])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const rows = table.getRowModel().rows

  // Reset focused row when data changes
  useEffect(() => {
    setFocusedRowIndex(-1)
  }, [data])

  const handleArrowUp = useCallback(() => {
    setFocusedRowIndex(prev => {
      if (rows.length === 0) return -1
      if (prev <= 0) return 0
      return prev - 1
    })
  }, [rows.length])

  const handleArrowDown = useCallback(() => {
    setFocusedRowIndex(prev => {
      if (rows.length === 0) return -1
      if (prev >= rows.length - 1) return rows.length - 1
      return prev + 1
    })
  }, [rows.length])

  const handleEnter = useCallback(() => {
    if (focusedRowIndex >= 0 && focusedRowIndex < rows.length && onView) {
      onView(rows[focusedRowIndex].original)
    }
  }, [focusedRowIndex, rows, onView])

  const handleEditShortcut = useCallback(() => {
    if (focusedRowIndex >= 0 && focusedRowIndex < rows.length && onEdit) {
      onEdit(rows[focusedRowIndex].original)
    }
  }, [focusedRowIndex, rows, onEdit])

  useKeyboardShortcuts(useMemo(() => [
    { key: 'arrowup', handler: handleArrowUp, description: t('shortcutNavigate') },
    { key: 'arrowdown', handler: handleArrowDown },
    { key: 'enter', handler: handleEnter, description: t('shortcutView') },
    { key: 'e', handler: handleEditShortcut, description: t('shortcutEdit') }
  ], [handleArrowUp, handleArrowDown, handleEnter, handleEditShortcut, t]))

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className={styles.th}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {t('noDataFound')}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={`${styles.row} ${index === focusedRowIndex ? styles.focused : ''}`}
                onClick={() => setFocusedRowIndex(index)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={styles.td}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
