/**
 * Prisma Schema Parser
 *
 * Parses Prisma schema files into a structured format using @prisma/internals.
 * Supports both single files and directories of .prisma files.
 */

import prismaInternals from '@prisma/internals'
import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import type { Schema, Model, Field, Enum, FieldType } from './types.js'

const { getDMMF } = prismaInternals

/** Mapping from Prisma types to JavaScript types */
const PRISMA_TO_JS_TYPES: Record<string, FieldType> = {
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  DateTime: 'date',
  BigInt: 'bigint',
  Decimal: 'decimal',
  Json: 'json',
  Bytes: 'bytes'
}

/**
 * Parse a Prisma schema file or directory of .prisma files
 *
 * @param schemaPath - Path to schema.prisma file or directory containing .prisma files.
 *                     If not provided, searches common locations.
 * @returns Parsed schema with models and enums
 *
 * @example
 * ```typescript
 * // Single file
 * const schema = await parseSchema('./prisma/schema.prisma')
 *
 * // Directory of .prisma files (modular schema)
 * const schema = await parseSchema('./prisma/schema')
 * ```
 */
export async function parseSchema(schemaPath?: string): Promise<Schema> {
  const path = resolveSchemaPath(schemaPath)

  if (!existsSync(path)) {
    throw new Error(`Schema path not found: ${path}`)
  }

  const schemaContent = readSchemaContent(path)
  return parseDMMF(schemaContent)
}

/**
 * Parse a Prisma schema from its content string
 *
 * @param schemaContent - Raw Prisma schema content
 * @returns Parsed schema with models and enums
 */
export async function parseDMMF(schemaContent: string): Promise<Schema> {
  const dmmf = await getDMMF({ datamodel: schemaContent })

  // Cast to unknown first to avoid complex readonly type issues from @prisma/internals
  const rawEnums = dmmf.datamodel.enums as unknown as RawEnum[]
  const rawModels = dmmf.datamodel.models as unknown as RawModel[]

  const enums = parseEnums(rawEnums)
  const models = parseModels(rawModels, enums)

  return { models, enums }
}

/**
 * Read schema content from a file or directory.
 * If the path is a directory, reads all .prisma files and concatenates them.
 */
function readSchemaContent(schemaPath: string): string {
  const stat = statSync(schemaPath)

  if (stat.isDirectory()) {
    return readSchemaDirectory(schemaPath)
  }

  return readFileSync(schemaPath, 'utf-8')
}

/**
 * Read all .prisma files from a directory and concatenate them.
 * Files are sorted alphabetically for consistent ordering.
 */
function readSchemaDirectory(dirPath: string): string {
  const files = readdirSync(dirPath)
    .filter(f => f.endsWith('.prisma'))
    .sort()

  if (files.length === 0) {
    throw new Error(`No .prisma files found in directory: ${dirPath}`)
  }

  return files
    .map(f => readFileSync(join(dirPath, f), 'utf-8'))
    .join('\n\n')
}

/**
 * Resolve schema path, searching common locations if not provided
 */
function resolveSchemaPath(customPath?: string): string {
  if (customPath) {
    return resolve(customPath)
  }

  const possiblePaths = [
    'prisma/schema.prisma',
    'prisma/schema',            // directory of .prisma files
    'schema.prisma',
    'src/prisma/schema.prisma'
  ]

  for (const p of possiblePaths) {
    const fullPath = resolve(process.cwd(), p)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }

  return resolve(process.cwd(), 'prisma/schema.prisma')
}

/** Raw DMMF types (simplified from @prisma/internals) */
interface RawEnumValue {
  name: string
  dbName?: string | null
}

interface RawEnum {
  name: string
  values: RawEnumValue[]
  documentation?: string
}

interface RawField {
  name: string
  type: string
  isRequired: boolean
  isList: boolean
  isUnique: boolean
  isId: boolean
  isUpdatedAt?: boolean
  hasDefaultValue: boolean
  default?: unknown
  documentation?: string
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  relationOnDelete?: string
}

interface RawModel {
  name: string
  dbName?: string | null
  documentation?: string
  fields: RawField[]
  primaryKey?: { fields: string[] } | null
  uniqueFields?: string[][]
}

/**
 * Parse DMMF enums into our Enum format
 */
function parseEnums(dmmfEnums: RawEnum[]): Enum[] {
  return dmmfEnums.map(e => ({
    name: e.name,
    values: e.values.map(v => v.name),
    documentation: e.documentation
  }))
}

/**
 * Parse DMMF models into our Model format
 */
function parseModels(dmmfModels: RawModel[], enums: Enum[]): Model[] {
  const enumNames = new Set(enums.map(e => e.name))

  return dmmfModels.map(model => ({
    name: model.name,
    dbName: model.dbName ?? undefined,
    documentation: model.documentation,
    fields: model.fields.map(field => parseField(field, enumNames, enums)),
    primaryKey: model.primaryKey?.fields,
    uniqueFields: model.uniqueFields
  }))
}

/**
 * Parse a single DMMF field into our Field format
 */
function parseField(field: RawField, enumNames: Set<string>, enums: Enum[]): Field {
  const isEnum = enumNames.has(field.type)
  const enumDef = isEnum ? enums.find(e => e.name === field.type) : undefined

  const fieldType = getFieldType(field.type, isEnum)

  return {
    name: field.name,
    type: fieldType,
    isRequired: field.isRequired,
    isList: field.isList,
    isUnique: field.isUnique,
    isId: field.isId,
    isUpdatedAt: field.isUpdatedAt ?? false,
    hasDefaultValue: field.hasDefaultValue,
    default: field.default,
    documentation: field.documentation,
    relationName: field.relationName,
    relationFromFields: field.relationFromFields,
    relationToFields: field.relationToFields,
    relationOnDelete: field.relationOnDelete,
    enumValues: enumDef?.values,
    relatedModel: fieldType === 'relation' ? field.type : undefined
  }
}

/**
 * Get JavaScript field type from Prisma type
 */
function getFieldType(prismaType: string, isEnum: boolean): FieldType {
  if (isEnum) return 'enum'
  if (PRISMA_TO_JS_TYPES[prismaType]) return PRISMA_TO_JS_TYPES[prismaType]
  return 'relation'
}
