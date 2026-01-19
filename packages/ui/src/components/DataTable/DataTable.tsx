import { useState, useMemo } from 'react'
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
import type { PradaModel, PradaField } from '@/types'
import styles from './DataTable.module.css'

interface DataTableProps {
  model: PradaModel
  data: Record<string, unknown>[]
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (row: Record<string, unknown>) => void
  onView?: (row: Record<string, unknown>) => void
}

export function DataTable({ model, data, onEdit, onDelete, onView }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { t } = useTranslation()

  const formatCellValue = (value: unknown, field: PradaField): string => {
    if (value === null || value === undefined) return '-'

    switch (field.type) {
      case 'boolean':
        return value ? t('yes') : t('no')
      case 'date':
        return new Date(value as string).toLocaleString()
      case 'json':
        return JSON.stringify(value).slice(0, 50) + '...'
      case 'relation':
        if (Array.isArray(value)) {
          return `${value.length} ${t('items')}`
        }
        if (typeof value === 'object' && value !== null) {
          const obj = value as Record<string, unknown>
          return String(obj.name || obj.title || obj.email || obj.id || '[Object]')
        }
        return String(value)
      default:
        return String(value)
    }
  }

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const scalarFields = model.fields.filter(f => f.type !== 'relation')

    const fieldColumns: ColumnDef<Record<string, unknown>>[] = scalarFields
      .slice(0, 6)
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
        cell: ({ row }) => formatCellValue(row.getValue(field.name), field)
      }))

    const actionsColumn: ColumnDef<Record<string, unknown>> = {
      id: 'actions',
      header: () => t('actions').toUpperCase(),
      cell: ({ row }) => (
        <div className={styles.actions}>
          {onView && (
            <button
              className={styles.actionButton}
              onClick={() => onView(row.original)}
              title={t('view')}
            >
              <Eye size={16} />
            </button>
          )}
          {onEdit && (
            <button
              className={styles.actionButton}
              onClick={() => onEdit(row.original)}
              title={t('edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={() => onDelete(row.original)}
              title={t('delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }

    return [...fieldColumns, actionsColumn]
  }, [model, onEdit, onDelete, onView, t])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

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
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {t('noDataFound')}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className={styles.row}>
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
