/**
 * Update Operation - Update existing records
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig, CrudHooks, CrudHookContext } from '../types.js'
import { sanitizeInput, parseId, getModelClient } from '../sanitizer.js'

export interface UpdateOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createUpdate({ prisma, schema, config, hooks }: UpdateOptions) {
  return async (
    modelName: string,
    id: string | number,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${modelName}" has no id field`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('update')) throw new Error(`Update not allowed for "${modelName}"`)

    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeUpdate hooks
    let d = { ...data }
    if (hooks?.['*']?.beforeUpdate) d = await hooks['*'].beforeUpdate(id, d, ctx)
    if (hooks?.[modelName]?.beforeUpdate) d = await hooks[modelName]!.beforeUpdate!(id, d, ctx)

    // Get readonly fields and sanitize
    const readonlyFields = config?.fields
      ? Object.entries(config.fields).filter(([, c]) => c.readonly).map(([n]) => n)
      : []

    const record = await getModelClient(prisma, modelName).update({
      where: { [idField.name]: parseId(model, id) },
      data: sanitizeInput(model, d, readonlyFields)
    })

    // Run afterUpdate hooks
    if (hooks?.['*']?.afterUpdate) await hooks['*'].afterUpdate(record, ctx)
    if (hooks?.[modelName]?.afterUpdate) await hooks[modelName]!.afterUpdate!(record, ctx)

    return record
  }
}
