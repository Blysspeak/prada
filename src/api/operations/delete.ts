/**
 * Delete Operation - Remove records
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig, CrudHooks, CrudHookContext } from '../types.js'
import { parseId, getModelClient } from '../sanitizer.js'

export interface DeleteOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createDelete({ prisma, schema, config, hooks }: DeleteOptions) {
  return async (modelName: string, id: string | number): Promise<Record<string, unknown>> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${modelName}" has no id field`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('delete')) throw new Error(`Delete not allowed for "${modelName}"`)

    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeDelete hooks
    if (hooks?.['*']?.beforeDelete) await hooks['*'].beforeDelete(id, ctx)
    if (hooks?.[modelName]?.beforeDelete) await hooks[modelName]!.beforeDelete!(id, ctx)

    const record = await getModelClient(prisma, modelName).delete({
      where: { [idField.name]: parseId(model, id) }
    })

    // Run afterDelete hooks
    if (hooks?.['*']?.afterDelete) await hooks['*'].afterDelete(id, ctx)
    if (hooks?.[modelName]?.afterDelete) await hooks[modelName]!.afterDelete!(id, ctx)

    return record
  }
}
