/**
 * Bulk Update Operation - Update multiple records at once
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig, CrudHooks, CrudHookContext } from '../types.js'
import { sanitizeInput, parseId, getModelClient } from '../sanitizer.js'

export interface BulkUpdateOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createBulkUpdate({ prisma, schema, config, hooks }: BulkUpdateOptions) {
  return async (
    modelName: string,
    ids: (string | number)[],
    data: Record<string, unknown>
  ): Promise<{ count: number }> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${modelName}" has no id field`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('update')) throw new Error(`Update not allowed for "${modelName}"`)

    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeUpdate hooks for each id
    let d = { ...data }
    for (const id of ids) {
      if (hooks?.['*']?.beforeUpdate) d = await hooks['*'].beforeUpdate(id, d, ctx)
      if (hooks?.[modelName]?.beforeUpdate) d = await hooks[modelName]!.beforeUpdate!(id, d, ctx)
    }

    // Get readonly fields and sanitize
    const readonlyFields = config?.fields
      ? Object.entries(config.fields).filter(([, c]) => c.readonly).map(([n]) => n)
      : []

    const parsedIds = ids.map(id => parseId(model, id))

    const result = await getModelClient(prisma, modelName).updateMany({
      where: { [idField.name]: { in: parsedIds } },
      data: sanitizeInput(model, d, readonlyFields)
    })

    // Run afterUpdate hooks (with a synthetic record containing the updated data)
    for (const id of ids) {
      if (hooks?.['*']?.afterUpdate) await hooks['*'].afterUpdate({ id, ...d }, ctx)
      if (hooks?.[modelName]?.afterUpdate) await hooks[modelName]!.afterUpdate!({ id, ...d }, ctx)
    }

    return result
  }
}
