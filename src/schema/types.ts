/**
 * PRADA Schema Types
 *
 * These types represent the parsed Prisma schema structure.
 * They are used throughout the library for type-safe schema operations.
 */

/** Field type mapping from Prisma types to JavaScript types */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'bigint'
  | 'decimal'
  | 'json'
  | 'bytes'
  | 'enum'
  | 'relation'

/** Represents a field in a Prisma model */
export interface Field {
  /** Field name */
  name: string
  /** JavaScript type of the field */
  type: FieldType
  /** Whether the field is required (not nullable) */
  isRequired: boolean
  /** Whether the field is a list/array */
  isList: boolean
  /** Whether the field has a unique constraint */
  isUnique: boolean
  /** Whether the field is the primary key */
  isId: boolean
  /** Whether the field is auto-updated (@updatedAt) */
  isUpdatedAt: boolean
  /** Whether the field has a default value */
  hasDefaultValue: boolean
  /** Default value if any */
  default?: unknown
  /** Documentation comment from schema */
  documentation?: string
  /** Relation name if this is a relation field */
  relationName?: string
  /** Fields in this model that form the relation */
  relationFromFields?: string[]
  /** Fields in the related model */
  relationToFields?: string[]
  /** ON DELETE action for the relation */
  relationOnDelete?: string
  /** Enum values if this is an enum field */
  enumValues?: string[]
}

/** Represents a Prisma model */
export interface Model {
  /** Model name (PascalCase) */
  name: string
  /** Database table name if different from model name */
  dbName?: string
  /** Documentation comment from schema */
  documentation?: string
  /** All fields in the model */
  fields: Field[]
  /** Composite primary key fields if any */
  primaryKey?: string[]
  /** Composite unique constraints */
  uniqueFields?: string[][]
}

/** Represents a Prisma enum */
export interface Enum {
  /** Enum name */
  name: string
  /** Enum values */
  values: string[]
  /** Documentation comment from schema */
  documentation?: string
}

/** Parsed Prisma schema */
export interface Schema {
  /** All models in the schema */
  models: Model[]
  /** All enums in the schema */
  enums: Enum[]
}

/** Map of model names to their models for quick lookup */
export interface ModelMap {
  [modelName: string]: Model
}
