/**
 * Data Sanitizer
 *
 * Utilities for sanitizing and validating input data before database operations.
 */

import type { Model, Field, FieldType } from '../schema/types.js'
import type { PrismaClient } from './types.js'
import { getScalarFields } from '../schema/index.js'

/**
 * Get Prisma client for a model (converts PascalCase to camelCase)
 */
export function getModelClient(prisma: PrismaClient, modelName: string) {
  return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
}

/**
 * Convert a value to the appropriate type for a field
 *
 * @example
 * ```typescript
 * convertFieldValue('number', '42') // 42
 * convertFieldValue('boolean', 'true') // true
 * convertFieldValue('date', '2024-01-01') // Date object
 * ```
 */
export function convertFieldValue(type: FieldType, value: unknown): unknown {
  if (value === null || value === undefined) return value

  switch (type) {
    case 'number':
      return typeof value === 'string' ? parseFloat(value) : value
    case 'boolean':
      return typeof value === 'string' ? value === 'true' : Boolean(value)
    case 'date':
      return value instanceof Date ? value : new Date(value as string)
    case 'bigint':
      return BigInt(value as string | number)
    case 'json':
      return typeof value === 'string' ? JSON.parse(value) : value
    default:
      return value
  }
}

/**
 * Sanitize input data for a model, removing readonly and relation fields
 *
 * @example
 * ```typescript
 * const sanitized = sanitizeInput(userModel, { name: 'John', id: 1, posts: [] })
 * // { name: 'John' } - id is auto-generated, posts is a relation
 * ```
 */
export function sanitizeInput(
  model: Model,
  data: Record<string, unknown>,
  readonlyFields: string[] = []
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const scalarFields = getScalarFields(model)

  scalarFields.forEach(field => {
    if (field.name in data && !readonlyFields.includes(field.name)) {
      result[field.name] = convertFieldValue(field.type, data[field.name])
    }
  })

  return result
}

/**
 * Validate that required fields are present in the data
 *
 * @example
 * ```typescript
 * const errors = validateRequired(userModel, { name: 'John' })
 * // ['email is required'] if email is a required field
 * ```
 */
export function validateRequired(
  model: Model,
  data: Record<string, unknown>
): string[] {
  const errors: string[] = []
  const scalarFields = getScalarFields(model)

  scalarFields.forEach(field => {
    if (
      field.isRequired &&
      !field.hasDefaultValue &&
      !field.isId &&
      !(field.name in data)
    ) {
      errors.push(`${field.name} is required`)
    }
  })

  return errors
}

/**
 * Validate input data for a model
 *
 * @returns Object with isValid flag and errors array
 *
 * @example
 * ```typescript
 * const { isValid, errors } = validateInput(userModel, { name: 'John' })
 * if (!isValid) {
 *   console.error(errors)
 * }
 * ```
 */
export function validateInput(
  model: Model,
  data: Record<string, unknown>,
  options: {
    checkRequired?: boolean
    allowedFields?: string[]
  } = {}
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (options.checkRequired !== false) {
    errors.push(...validateRequired(model, data))
  }

  // Check for unknown fields
  if (options.allowedFields) {
    Object.keys(data).forEach(key => {
      if (!options.allowedFields!.includes(key)) {
        errors.push(`Unknown field: ${key}`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Parse an ID value to the correct type based on the model's ID field
 *
 * @example
 * ```typescript
 * const id = parseId(userModel, '42') // 42 (number) if id field is Int
 * ```
 */
export function parseId(model: Model, id: string | number): string | number {
  const idField = model.fields.find(f => f.isId)
  if (!idField) {
    throw new Error(`Model "${model.name}" has no id field`)
  }

  return idField.type === 'number' ? parseInt(String(id), 10) : id
}
