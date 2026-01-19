// PRADA Types - JavaScript version (TypeScript types are for documentation only)
// These are JSDoc type definitions for IDE support

/**
 * @typedef {Object} PradaField
 * @property {string} name
 * @property {string} type
 * @property {boolean} isRequired
 * @property {boolean} isList
 * @property {boolean} isUnique
 * @property {boolean} isId
 * @property {boolean} isUpdatedAt
 * @property {boolean} hasDefaultValue
 * @property {*} [default]
 * @property {string} [documentation]
 * @property {string} [relationName]
 * @property {string[]} [relationFromFields]
 * @property {string[]} [relationToFields]
 * @property {string} [relationOnDelete]
 * @property {string[]} [enumValues]
 */

/**
 * @typedef {Object} PradaModel
 * @property {string} name
 * @property {string} [dbName]
 * @property {PradaField[]} fields
 * @property {string[]} [primaryKey]
 * @property {string[][]} [uniqueFields]
 * @property {string} [documentation]
 */

/**
 * @typedef {Object} PradaSchema
 * @property {PradaModel[]} models
 * @property {PradaEnum[]} enums
 */

/**
 * @typedef {Object} PradaEnum
 * @property {string} name
 * @property {string[]} values
 * @property {string} [documentation]
 */

/**
 * @typedef {Object} PradaAuthConfig
 * @property {string} email
 * @property {string} password
 * @property {string} [jwtSecret]
 * @property {string} [jwtExpiresIn]
 * @property {string} [refreshExpiresIn]
 */

/**
 * @typedef {Object} PradaUser
 * @property {string} email
 * @property {'admin'|'editor'|'viewer'} role
 */

/**
 * @typedef {Object} PradaTokenPayload
 * @property {string} email
 * @property {string} role
 * @property {number} iat
 * @property {number} exp
 */

/**
 * @typedef {Object} PradaPaginatedResponse
 * @property {Array} data
 * @property {{total: number, page: number, limit: number, totalPages: number}} meta
 */

/**
 * @typedef {Object} PradaQueryParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [sort]
 * @property {'asc'|'desc'} [order]
 * @property {string} [search]
 * @property {string} [include]
 * @property {Object} [filters]
 */

export {}
