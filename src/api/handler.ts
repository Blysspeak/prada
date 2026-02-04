/**
 * API Handler
 *
 * Main API handler that combines all CRUD operations with configuration and hooks.
 */

import type { Schema } from '../schema/types.js'
import type {
  PrismaClient,
  ApiHandler,
  ApiHandlerOptions,
  FindManyParams,
  PaginatedResponse
} from './types.js'
import { createFindMany } from './operations/findMany.js'
import { createFindOne } from './operations/findOne.js'
import { createCreate } from './operations/create.js'
import { createUpdate } from './operations/update.js'
import { createDelete } from './operations/delete.js'

/**
 * Create an API handler for CRUD operations
 *
 * @example
 * ```typescript
 * const api = createApiHandler(prisma, schema, {
 *   hooks: {
 *     'user.beforeCreate': async (data) => ({ ...data, createdAt: new Date() }),
 *     '*.afterDelete': async (id, ctx) => console.log(`Deleted ${ctx.model}:${id}`)
 *   },
 *   models: {
 *     User: { actions: ['read'], fields: { password: { hidden: true } } }
 *   }
 * })
 * ```
 */
export function createApiHandler(
  prisma: PrismaClient,
  schema: Schema,
  options: ApiHandlerOptions = {}
): ApiHandler {
  const { models = {}, hooks = {} } = options
  const ctx = { prisma, schema, hooks }

  return {
    findMany: (model, params = {}) =>
      createFindMany({ ...ctx, config: models[model] })(model, params),

    findOne: (model, id, include) =>
      createFindOne({ ...ctx, config: models[model] })(model, id, include),

    create: (model, data) =>
      createCreate({ ...ctx, config: models[model] })(model, data),

    update: (model, id, data) =>
      createUpdate({ ...ctx, config: models[model] })(model, id, data),

    remove: (model, id) =>
      createDelete({ ...ctx, config: models[model] })(model, id),

    getSchema: () => schema
  }
}
