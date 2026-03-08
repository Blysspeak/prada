/**
 * Stats Operation - Get record counts for all models
 */

import type { Schema } from '../../schema/types.js'
import type { PrismaClient, StatsResponse, ModelStats } from '../types.js'
import { getModelClient } from '../sanitizer.js'

export interface StatsOptions {
  prisma: PrismaClient
  schema: Schema
}

export function createStats({ prisma, schema }: StatsOptions) {
  return async (): Promise<StatsResponse> => {
    const models: ModelStats[] = []

    for (const model of schema.models) {
      const client = getModelClient(prisma, model.name)

      // Count total records
      const count = await client.count()

      // Check for a date field (createdAt or created_at) for recent count
      const dateField = model.fields.find(
        f => f.type === 'date' && (f.name === 'createdAt' || f.name === 'created_at')
      )

      let recentCount: number | undefined
      if (dateField) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        recentCount = await client.count({
          where: { [dateField.name]: { gte: oneDayAgo } }
        })
      }

      models.push({ name: model.name, count, recentCount })
    }

    return { models }
  }
}
