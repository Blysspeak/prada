/**
 * Audit Store
 *
 * In-memory ring buffer audit store implementation.
 */

import type { AuditEntry, AuditStore } from './types.js'

let idCounter = 0

function generateId(): string {
  idCounter++
  return `${Date.now()}-${idCounter}`
}

/**
 * Create an in-memory audit store with a fixed-size ring buffer.
 *
 * @param options - Store configuration
 * @returns AuditStore instance
 */
export function createAuditStore(options?: { maxEntries?: number }): AuditStore {
  const maxEntries = options?.maxEntries ?? 10000
  const entries: AuditEntry[] = []

  return {
    log(entry) {
      const auditEntry: AuditEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date()
      }

      entries.unshift(auditEntry)

      // Trim to max size
      if (entries.length > maxEntries) {
        entries.length = maxEntries
      }
    },

    getAll(options) {
      const { limit = 50, offset = 0, model, action } = options ?? {}

      let filtered = entries

      if (model) {
        filtered = filtered.filter(e => e.model === model)
      }

      if (action) {
        filtered = filtered.filter(e => e.action === action)
      }

      const total = filtered.length
      const paged = filtered.slice(offset, offset + limit)

      return { entries: paged, total }
    },

    getByModel(model, limit) {
      const filtered = entries.filter(e => e.model === model)
      return limit ? filtered.slice(0, limit) : filtered
    },

    getByRecord(model, recordId) {
      const rid = String(recordId)
      return entries.filter(e => e.model === model && String(e.recordId) === rid)
    },

    clear() {
      entries.length = 0
    }
  }
}
