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
    const model = schema.models.find(m => m.name.toLowerCase() === modelName.toLowerCase())
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const resolvedName = model.name
    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${resolvedName}" has no id field`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('delete')) throw new Error(`Delete not allowed for "${resolvedName}"`)

    const ctx: CrudHookContext = { model: resolvedName, schema, prisma }

    // Run beforeDelete hooks
    if (hooks?.['*']?.beforeDelete) await hooks['*'].beforeDelete(id, ctx)
    if (hooks?.[resolvedName]?.beforeDelete) await hooks[resolvedName]!.beforeDelete!(id, ctx)

    const record = await getModelClient(prisma, resolvedName).delete({
      where: { [idField.name]: parseId(model, id) }
    })

    // Run afterDelete hooks
    if (hooks?.['*']?.afterDelete) await hooks['*'].afterDelete(id, ctx)
    if (hooks?.[resolvedName]?.afterDelete) await hooks[resolvedName]!.afterDelete!(id, ctx)

    return record
  }
}
