/**
 * Audit Log Types
 *
 * Types for the audit logging system.
 */

export interface AuditEntry {
  id: string
  model: string
  recordId: string | number
  action: 'create' | 'update' | 'delete'
  changes: AuditChange[]
  userId?: string
  timestamp: Date
}

export interface AuditChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface AuditStore {
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void
  getAll(options?: { limit?: number; offset?: number; model?: string; action?: string }): { entries: AuditEntry[]; total: number }
  getByModel(model: string, limit?: number): AuditEntry[]
  getByRecord(model: string, recordId: string | number): AuditEntry[]
  clear(): void
}

export interface AuditOptions {
  /** Maximum number of entries to keep (default: 10000) */
  maxEntries?: number
  /** Enable or disable audit logging (default: true) */
  enabled?: boolean
}
