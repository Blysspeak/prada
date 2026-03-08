import type { PradaField } from '@/types'

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatFieldValue(value: unknown, field: PradaField): string {
  if (value === null || value === undefined) return ''

  switch (field.type) {
    case 'boolean':
      return value ? 'true' : 'false'
    case 'date':
      return new Date(value as string).toISOString()
    case 'json':
      return JSON.stringify(value)
    case 'relation':
      if (Array.isArray(value)) return `[${value.length} items]`
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>
        return String(obj.name || obj.title || obj.email || obj.id || '')
      }
      return String(value)
    default:
      return String(value)
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCSV(
  data: Record<string, unknown>[],
  fields: PradaField[],
  filename: string
) {
  const scalarFields = fields.filter(f => f.type !== 'relation')

  // Header row
  const header = scalarFields.map(f => escapeCSVValue(f.name)).join(',')

  // Data rows
  const rows = data.map(row =>
    scalarFields
      .map(field => escapeCSVValue(formatFieldValue(row[field.name], field)))
      .join(',')
  )

  // BOM for Excel compatibility
  const bom = '\uFEFF'
  const csv = bom + [header, ...rows].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

export function exportToJSON(
  data: Record<string, unknown>[],
  filename: string
) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`)
}
