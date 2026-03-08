/**
 * Audit Hooks
 *
 * Factory that creates CRUD hooks for audit logging.
 */

import type { CrudHooks } from '../api/types.js'
import type { AuditStore, AuditChange } from './types.js'

/**
 * Extract the record ID from a result object.
 * Looks for common ID field names.
 */
function getRecordId(record: Record<string, unknown>): string | number {
  const id = record.id ?? record.Id ?? record.ID ?? record._id
  if (id !== undefined && id !== null) return id as string | number
  // Fallback: find first field that looks like an ID
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === 'id' || key.endsWith('Id') || key.endsWith('_id')) {
      if (value !== undefined && value !== null) return value as string | number
    }
  }
  return 'unknown'
}

/**
 * Compute changes between two records.
 */
function computeChanges(
  original: Record<string, unknown> | undefined,
  updated: Record<string, unknown>
): AuditChange[] {
  if (!original) return []

  const changes: AuditChange[] = []
  const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)])

  for (const key of allKeys) {
    const oldValue = original[key]
    const newValue = updated[key]

    // Skip relation objects and functions
    if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue) && !(oldValue instanceof Date)) continue
    if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue) && !(newValue instanceof Date)) continue

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field: key, oldValue, newValue })
    }
  }

  return changes
}

/**
 * Create CRUD hooks for audit logging.
 *
 * These hooks log create, update, and delete operations to the audit store.
 * The hooks follow the existing hook signatures from the CRUD operations:
 * - afterCreate: (record, context) => void
 * - afterUpdate: (record, context) => void
 * - afterDelete: (id, context) => void
 *
 * @param store - The audit store to log entries to
 * @returns CrudHooks object with global hooks
 */
export function createAuditHooks(store: AuditStore): CrudHooks {
  // Keep track of records before update for diff computation
  const pendingUpdates = new Map<string, Record<string, unknown>>()

  return {
    '*': {
      beforeUpdate: async (id, data, context) => {
        // Fetch the current record before update for diff
        try {
          const client = context.prisma[context.model]
          if (client?.findUnique) {
            const current = await client.findUnique({ where: { id } as Record<string, unknown> })
            if (current) {
              pendingUpdates.set(`${context.model}:${id}`, current)
            }
          }
        } catch {
          // If we can't fetch the original, we'll skip diff
        }
        return data
      },

      afterCreate: async (record, context) => {
        store.log({
          model: context.model,
          recordId: getRecordId(record),
          action: 'create',
          changes: []
        })
      },

      afterUpdate: async (record, context) => {
        const recordId = getRecordId(record)
        const key = `${context.model}:${recordId}`
        const original = pendingUpdates.get(key)
        pendingUpdates.delete(key)

        const changes = computeChanges(original, record)

        store.log({
          model: context.model,
          recordId,
          action: 'update',
          changes
        })
      },

      afterDelete: async (id, context) => {
        store.log({
          model: context.model,
          recordId: id,
          action: 'delete',
          changes: []
        })
      }
    }
  }
}
