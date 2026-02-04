/**
 * Create Operation - Create new records
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig, CrudHooks, CrudHookContext } from '../types.js'
import { sanitizeInput, getModelClient } from '../sanitizer.js'

export interface CreateOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
  hooks?: CrudHooks
}

export function createCreate({ prisma, schema, config, hooks }: CreateOptions) {
  return async (modelName: string, data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    // Check permission
    const actions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!actions.includes('create')) throw new Error(`Create not allowed for "${modelName}"`)

    const ctx: CrudHookContext = { model: modelName, schema, prisma }

    // Run beforeCreate hooks
    let d = { ...data }
    if (hooks?.['*']?.beforeCreate) d = await hooks['*'].beforeCreate(d, ctx)
    if (hooks?.[modelName]?.beforeCreate) d = await hooks[modelName]!.beforeCreate!(d, ctx)

    // Get readonly fields and sanitize
    const readonlyFields = config?.fields
      ? Object.entries(config.fields).filter(([, c]) => c.readonly).map(([n]) => n)
      : []

    const record = await getModelClient(prisma, modelName).create({
      data: sanitizeInput(model, d, readonlyFields)
    })

    // Run afterCreate hooks
    if (hooks?.['*']?.afterCreate) await hooks['*'].afterCreate(record, ctx)
    if (hooks?.[modelName]?.afterCreate) await hooks[modelName]!.afterCreate!(record, ctx)

    return record
  }
}
