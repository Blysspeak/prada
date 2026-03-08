/**
 * Bulk Delete Operation - Remove multiple records at once
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig, CrudHooks, CrudHookContext } from '../types.js'
import { parseId, getModelClient } from '../sanitizer.js'

export interface BulkDeleteOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createBulkDelete({ prisma, schema, config, hooks }: BulkDeleteOptions) {
  return async (modelName: string, ids: (string | number)[]): Promise<{ count: number }> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${modelName}" has no id field`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('delete')) throw new Error(`Delete not allowed for "${modelName}"`)

    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeDelete hooks for each id
    for (const id of ids) {
      if (hooks?.['*']?.beforeDelete) await hooks['*'].beforeDelete(id, ctx)
      if (hooks?.[modelName]?.beforeDelete) await hooks[modelName]!.beforeDelete!(id, ctx)
    }

    const parsedIds = ids.map(id => parseId(model, id))

    const result = await getModelClient(prisma, modelName).deleteMany({
      where: { [idField.name]: { in: parsedIds } }
    })

    // Run afterDelete hooks for each id
    for (const id of ids) {
      if (hooks?.['*']?.afterDelete) await hooks['*'].afterDelete(id, ctx)
      if (hooks?.[modelName]?.afterDelete) await hooks[modelName]!.afterDelete!(id, ctx)
    }

    return result
  }
}
