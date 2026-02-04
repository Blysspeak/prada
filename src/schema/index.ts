/**
 * Schema Module
 *
 * Exports schema parsing utilities and helper functions.
 */

export * from './types.js'
export { parseSchema, parseDMMF } from './parser.js'

import type { Schema, Model, Field, Enum } from './types.js'

/**
 * Get a model by name (case-insensitive)
 *
 * @example
 * ```typescript
 * const userModel = getModelByName(schema, 'user')
 * ```
 */
export function getModelByName(schema: Schema, name: string): Model | undefined {
  return schema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
}

/**
 * Get all models as a map keyed by name
 *
 * @example
 * ```typescript
 * const models = getModels(schema)
 * const user = models.User
 * ```
 */
export function getModels(schema: Schema): Record<string, Model> {
  return Object.fromEntries(schema.models.map(m => [m.name, m]))
}

/**
 * Get all enums as a map keyed by name
 *
 * @example
 * ```typescript
 * const enums = getEnums(schema)
 * const status = enums.Status // { name: 'Status', values: ['PENDING', 'ACTIVE'] }
 * ```
 */
export function getEnums(schema: Schema): Record<string, Enum> {
  return Object.fromEntries(schema.enums.map(e => [e.name, e]))
}

/**
 * Get all scalar (non-relation) fields from a model
 *
 * @example
 * ```typescript
 * const scalars = getScalarFields(userModel)
 * // [{ name: 'id', type: 'number' }, { name: 'email', type: 'string' }]
 * ```
 */
export function getScalarFields(model: Model): Field[] {
  return model.fields.filter(f => f.type !== 'relation')
}

/**
 * Get all relation fields from a model
 *
 * @example
 * ```typescript
 * const relations = getRelationFields(userModel)
 * // [{ name: 'posts', type: 'relation', relationName: 'UserPosts' }]
 * ```
 */
export function getRelationFields(model: Model): Field[] {
  return model.fields.filter(f => f.type === 'relation')
}

/**
 * Get the primary key field from a model
 *
 * @example
 * ```typescript
 * const idField = getIdField(userModel)
 * // { name: 'id', type: 'number', isId: true }
 * ```
 */
export function getIdField(model: Model): Field | undefined {
  return model.fields.find(f => f.isId)
}

/**
 * Get all fields that can be searched (string fields without relations)
 *
 * @example
 * ```typescript
 * const searchable = getSearchableFields(userModel)
 * // [{ name: 'email', type: 'string' }, { name: 'name', type: 'string' }]
 * ```
 */
export function getSearchableFields(model: Model): Field[] {
  return model.fields.filter(f => f.type === 'string' && !f.relationName)
}

/**
 * Get all required fields from a model
 */
export function getRequiredFields(model: Model): Field[] {
  return model.fields.filter(f => f.isRequired && !f.hasDefaultValue && !f.isId)
}

/**
 * Get all relations for a schema (both sides of each relation)
 *
 * @example
 * ```typescript
 * const relations = getRelations(schema)
 * // [{ name: 'UserPosts', from: 'User', to: 'Post', fromField: 'posts', toField: 'author' }]
 * ```
 */
export function getRelations(schema: Schema): Array<{
  name: string
  from: string
  to: string
  fromField: string
  toField: string
}> {
  const relations: Array<{
    name: string
    from: string
    to: string
    fromField: string
    toField: string
  }> = []

  const seen = new Set<string>()

  for (const model of schema.models) {
    for (const field of model.fields) {
      if (field.relationName && !seen.has(field.relationName)) {
        seen.add(field.relationName)

        // Find the other side of the relation
        const relatedModel = schema.models.find(m =>
          m.fields.some(f => f.relationName === field.relationName && m.name !== model.name)
        )

        if (relatedModel) {
          const relatedField = relatedModel.fields.find(
            f => f.relationName === field.relationName
          )

          if (relatedField) {
            relations.push({
              name: field.relationName,
              from: model.name,
              to: relatedModel.name,
              fromField: field.name,
              toField: relatedField.name
            })
          }
        }
      }
    }
  }

  return relations
}
