import { getIdField, getSearchableFields, getScalarFields } from './schemaParser.js'

/**
 * Create API handler for CRUD operations
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{models: Array, enums: Array}} schema
 * @param {Object} [modelConfigs={}]
 */
export function createApiHandler(prisma, schema, modelConfigs = {}) {
  function getModelClient(modelName) {
    const key = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    return prisma[key]
  }

  function buildWhereClause(model, search, filters) {
    const where = {}

    if (search) {
      const searchFields = getSearchableFields(model)
      if (searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
          [field.name]: { contains: search, mode: 'insensitive' }
        }))
      }
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          where[key] = value
        }
      })
    }

    return where
  }

  function buildIncludeClause(model, includeParam) {
    if (!includeParam) return undefined

    const includes = includeParam.split(',').map(s => s.trim())
    const result = {}

    includes.forEach(fieldName => {
      const field = model.fields.find(f => f.name === fieldName)
      if (field && field.type === 'relation') {
        result[fieldName] = true
      }
    })

    return Object.keys(result).length > 0 ? result : undefined
  }

  function buildSelectClause(model, config) {
    const hiddenFields = config?.fields
      ? Object.entries(config.fields)
          .filter(([_, cfg]) => cfg.hidden)
          .map(([name]) => name)
      : []

    if (hiddenFields.length === 0) return undefined

    const select = {}
    model.fields.forEach(field => {
      if (!hiddenFields.includes(field.name)) {
        select[field.name] = true
      }
    })

    return select
  }

  async function findMany(modelName, params = {}) {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) {
      throw new Error(`Model "${modelName}" not found`)
    }

    const client = getModelClient(modelName)
    const config = modelConfigs[modelName]

    const page = params.page || 1
    const limit = Math.min(params.limit || 20, 100)
    const skip = (page - 1) * limit

    const orderBy = params.sort
      ? { [params.sort]: params.order || 'asc' }
      : config?.defaultSort
        ? { [config.defaultSort.field]: config.defaultSort.order }
        : undefined

    const where = buildWhereClause(model, params.search, params.filters)
    const include = buildIncludeClause(model, params.include)
    const select = buildSelectClause(model, config)

    const [data, total] = await Promise.all([
      client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: select ? undefined : include,
        select: select ? { ...select, ...(include || {}) } : undefined
      }),
      client.count({ where })
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async function findOne(modelName, id, include) {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) {
      throw new Error(`Model "${modelName}" not found`)
    }

    const client = getModelClient(modelName)
    const config = modelConfigs[modelName]
    const idField = getIdField(model)

    if (!idField) {
      throw new Error(`Model "${modelName}" has no id field`)
    }

    const parsedId = idField.type === 'number' ? parseInt(id, 10) : id
    const includeClause = buildIncludeClause(model, include)
    const select = buildSelectClause(model, config)

    return client.findUnique({
      where: { [idField.name]: parsedId },
      include: select ? undefined : includeClause,
      select: select ? { ...select, ...(includeClause || {}) } : undefined
    })
  }

  async function create(modelName, data) {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) {
      throw new Error(`Model "${modelName}" not found`)
    }

    const client = getModelClient(modelName)
    const config = modelConfigs[modelName]

    const allowedActions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!allowedActions.includes('create')) {
      throw new Error(`Create action is not allowed for model "${modelName}"`)
    }

    const sanitizedData = sanitizeData(model, data, config)

    return client.create({ data: sanitizedData })
  }

  async function update(modelName, id, data) {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) {
      throw new Error(`Model "${modelName}" not found`)
    }

    const client = getModelClient(modelName)
    const config = modelConfigs[modelName]
    const idField = getIdField(model)

    if (!idField) {
      throw new Error(`Model "${modelName}" has no id field`)
    }

    const allowedActions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!allowedActions.includes('update')) {
      throw new Error(`Update action is not allowed for model "${modelName}"`)
    }

    const parsedId = idField.type === 'number' ? parseInt(id, 10) : id
    const sanitizedData = sanitizeData(model, data, config)

    return client.update({
      where: { [idField.name]: parsedId },
      data: sanitizedData
    })
  }

  async function remove(modelName, id) {
    const model = schema.models.find(m => m.name === modelName)
    if (!model) {
      throw new Error(`Model "${modelName}" not found`)
    }

    const client = getModelClient(modelName)
    const config = modelConfigs[modelName]
    const idField = getIdField(model)

    if (!idField) {
      throw new Error(`Model "${modelName}" has no id field`)
    }

    const allowedActions = config?.actions || ['create', 'read', 'update', 'delete']
    if (!allowedActions.includes('delete')) {
      throw new Error(`Delete action is not allowed for model "${modelName}"`)
    }

    const parsedId = idField.type === 'number' ? parseInt(id, 10) : id

    return client.delete({
      where: { [idField.name]: parsedId }
    })
  }

  function sanitizeData(model, data, config) {
    const result = {}
    const scalarFields = getScalarFields(model)

    const readonlyFields = config?.fields
      ? Object.entries(config.fields)
          .filter(([_, cfg]) => cfg.readonly)
          .map(([name]) => name)
      : []

    scalarFields.forEach(field => {
      if (field.name in data && !readonlyFields.includes(field.name)) {
        result[field.name] = convertFieldValue(field.type, data[field.name])
      }
    })

    return result
  }

  function convertFieldValue(type, value) {
    if (value === null || value === undefined) return value

    switch (type) {
      case 'number':
        return typeof value === 'string' ? parseFloat(value) : value
      case 'boolean':
        return typeof value === 'string' ? value === 'true' : Boolean(value)
      case 'date':
        return value instanceof Date ? value : new Date(value)
      case 'bigint':
        return BigInt(value)
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value
      default:
        return value
    }
  }

  return {
    findMany,
    findOne,
    create,
    update,
    remove,
    getSchema: () => schema
  }
}
