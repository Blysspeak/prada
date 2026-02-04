/**
 * FindOne Operation - Retrieve a single record by ID
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, ModelConfig } from '../types.js'
import { buildIncludeClause, buildSelectClause } from '../query-builder.js'
import { parseId, getModelClient } from '../sanitizer.js'

export interface FindOneOptions {
  prisma: PrismaClient
  schema: Schema
  config?: ModelConfig
}

export function createFindOne({ prisma, schema, config }: FindOneOptions) {
  return async (
    modelName: string,
    id: string | number,
    include?: string
  ): Promise<Record<string, unknown> | null> => {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) throw new Error(`Model "${modelName}" not found`)

    const idField = model.fields.find(f => f.isId)
    if (!idField) throw new Error(`Model "${modelName}" has no id field`)

    const includeClause = buildIncludeClause(model, include)
    const select = buildSelectClause(model, config?.fields)

    return getModelClient(prisma, modelName).findUnique({
      where: { [idField.name]: parseId(model, id) },
      include: select ? undefined : includeClause,
      select: select ? { ...select, ...(includeClause || {}) } : undefined
    })
  }
}
