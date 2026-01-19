import prismaInternals from '@prisma/internals'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const { getDMMF } = prismaInternals

const PRISMA_TO_JS_TYPES = {
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
 * Parse Prisma schema file
 * @param {string} [schemaPath] - Path to schema.prisma
 * @returns {Promise<{models: Array, enums: Array}>}
 */
export async function parseSchema(schemaPath) {
  const path = resolveSchemaPath(schemaPath)

  if (!existsSync(path)) {
    throw new Error(`Schema file not found: ${path}`)
  }

  const schemaContent = readFileSync(path, 'utf-8')
  const dmmf = await getDMMF({ datamodel: schemaContent })

  const enums = parseEnums(dmmf.datamodel.enums)
  const models = parseModels(dmmf.datamodel.models, enums)

  return { models, enums }
}

function resolveSchemaPath(customPath) {
  if (customPath) {
    return resolve(customPath)
  }

  const possiblePaths = [
    'prisma/schema.prisma',
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

function parseEnums(dmmfEnums) {
  return [...dmmfEnums].map(e => ({
    name: e.name,
    values: e.values.map(v => v.name),
    documentation: e.documentation
  }))
}

function parseModels(dmmfModels, enums) {
  const enumNames = new Set(enums.map(e => e.name))

  return [...dmmfModels].map(model => ({
    name: model.name,
    dbName: model.dbName,
    documentation: model.documentation,
    fields: model.fields.map(field => parseField(field, enumNames, enums)),
    primaryKey: model.primaryKey?.fields,
    uniqueFields: model.uniqueFields
  }))
}

function parseField(field, enumNames, enums) {
  const isEnum = enumNames.has(field.type)
  const enumDef = isEnum ? enums.find(e => e.name === field.type) : undefined

  return {
    name: field.name,
    type: getFieldType(field.type, isEnum),
    isRequired: field.isRequired,
    isList: field.isList,
    isUnique: field.isUnique,
    isId: field.isId,
    isUpdatedAt: field.isUpdatedAt,
    hasDefaultValue: field.hasDefaultValue,
    default: field.default,
    documentation: field.documentation,
    relationName: field.relationName,
    relationFromFields: field.relationFromFields,
    relationToFields: field.relationToFields,
    relationOnDelete: field.relationOnDelete,
    enumValues: enumDef?.values
  }
}

function getFieldType(prismaType, isEnum) {
  if (isEnum) return 'enum'
  if (PRISMA_TO_JS_TYPES[prismaType]) return PRISMA_TO_JS_TYPES[prismaType]
  return 'relation'
}

export function getModelByName(schema, name) {
  return schema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
}

export function getScalarFields(model) {
  return model.fields.filter(f => f.type !== 'relation')
}

export function getRelationFields(model) {
  return model.fields.filter(f => f.type === 'relation')
}

export function getIdField(model) {
  return model.fields.find(f => f.isId)
}

export function getSearchableFields(model) {
  return model.fields.filter(f => f.type === 'string' && !f.relationName)
}
