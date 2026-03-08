/**
 * Tests for schema/index.ts
 */

import {
  getModelByName,
  getModels,
  getEnums,
  getScalarFields,
  getRelationFields,
  getIdField,
  getSearchableFields,
  getRequiredFields,
  getRelations
} from './index.js'
import {
  mockUserModel,
  mockPostModel,
  mockSchema,
  mockRoleEnum,
  createField
} from '../__tests__/fixtures.js'
import type { Schema, Model } from './types.js'

describe('getModelByName', () => {
  it('should find model by exact name', () => {
    const result = getModelByName(mockSchema, 'User')
    expect(result).toBe(mockUserModel)
  })

  it('should find model case-insensitively', () => {
    expect(getModelByName(mockSchema, 'user')).toBe(mockUserModel)
    expect(getModelByName(mockSchema, 'USER')).toBe(mockUserModel)
    expect(getModelByName(mockSchema, 'uSeR')).toBe(mockUserModel)
  })

  it('should return undefined for non-existent model', () => {
    expect(getModelByName(mockSchema, 'Comment')).toBeUndefined()
  })

  it('should return undefined for empty string', () => {
    expect(getModelByName(mockSchema, '')).toBeUndefined()
  })

  it('should work with empty schema', () => {
    const emptySchema: Schema = { models: [], enums: [] }
    expect(getModelByName(emptySchema, 'User')).toBeUndefined()
  })
})

describe('getModels', () => {
  it('should return models as a map keyed by name', () => {
    const result = getModels(mockSchema)

    expect(result.User).toBe(mockUserModel)
    expect(result.Post).toBe(mockPostModel)
    expect(Object.keys(result)).toHaveLength(2)
  })

  it('should return empty object for empty schema', () => {
    const emptySchema: Schema = { models: [], enums: [] }
    expect(getModels(emptySchema)).toEqual({})
  })
})

describe('getEnums', () => {
  it('should return enums as a map keyed by name', () => {
    const result = getEnums(mockSchema)

    expect(result.Role).toBe(mockRoleEnum)
    expect(Object.keys(result)).toHaveLength(1)
  })

  it('should return empty object for schema with no enums', () => {
    const schema: Schema = { models: [], enums: [] }
    expect(getEnums(schema)).toEqual({})
  })
})

describe('getScalarFields', () => {
  it('should return all non-relation fields', () => {
    const result = getScalarFields(mockUserModel)

    const fieldNames = result.map(f => f.name)
    expect(fieldNames).toContain('id')
    expect(fieldNames).toContain('email')
    expect(fieldNames).toContain('name')
    expect(fieldNames).toContain('role')
    expect(fieldNames).toContain('isActive')
    expect(fieldNames).toContain('createdAt')
    expect(fieldNames).toContain('updatedAt')
    expect(fieldNames).toContain('metadata')
    expect(fieldNames).not.toContain('posts')
  })

  it('should return all fields when no relations exist', () => {
    const model: Model = {
      name: 'Simple',
      fields: [
        createField({ name: 'id', type: 'number' }),
        createField({ name: 'name', type: 'string' })
      ]
    }

    const result = getScalarFields(model)
    expect(result).toHaveLength(2)
  })

  it('should return empty array when all fields are relations', () => {
    const model: Model = {
      name: 'JoinTable',
      fields: [
        createField({ name: 'user', type: 'relation' }),
        createField({ name: 'post', type: 'relation' })
      ]
    }

    expect(getScalarFields(model)).toHaveLength(0)
  })
})

describe('getRelationFields', () => {
  it('should return only relation fields', () => {
    const result = getRelationFields(mockUserModel)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('posts')
    expect(result[0].type).toBe('relation')
  })

  it('should return empty array when no relation fields', () => {
    const model: Model = {
      name: 'Simple',
      fields: [
        createField({ name: 'id', type: 'number' }),
        createField({ name: 'name', type: 'string' })
      ]
    }

    expect(getRelationFields(model)).toHaveLength(0)
  })
})

describe('getIdField', () => {
  it('should return the id field', () => {
    const result = getIdField(mockUserModel)

    expect(result).toBeDefined()
    expect(result!.name).toBe('id')
    expect(result!.isId).toBe(true)
  })

  it('should return undefined when no id field', () => {
    const model: Model = {
      name: 'NoId',
      fields: [
        createField({ name: 'name', type: 'string', isId: false })
      ]
    }

    expect(getIdField(model)).toBeUndefined()
  })
})

describe('getSearchableFields', () => {
  it('should return string fields without relation', () => {
    const result = getSearchableFields(mockUserModel)
    const names = result.map(f => f.name)

    expect(names).toContain('email')
    expect(names).toContain('name')
  })

  it('should exclude non-string fields', () => {
    const result = getSearchableFields(mockUserModel)
    const types = result.map(f => f.type)

    types.forEach(t => expect(t).toBe('string'))
  })

  it('should exclude fields with relationName', () => {
    const model: Model = {
      name: 'Test',
      fields: [
        createField({ name: 'label', type: 'string', isId: false, relationName: 'SomeRelation' }),
        createField({ name: 'description', type: 'string', isId: false })
      ]
    }

    const result = getSearchableFields(model)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('description')
  })

  it('should return empty array for model with no string fields', () => {
    const model: Model = {
      name: 'Numeric',
      fields: [
        createField({ name: 'id', type: 'number' }),
        createField({ name: 'count', type: 'number', isId: false })
      ]
    }

    expect(getSearchableFields(model)).toHaveLength(0)
  })
})

describe('getRequiredFields', () => {
  it('should return required fields without defaults and not id', () => {
    const result = getRequiredFields(mockUserModel)
    const names = result.map(f => f.name)

    // email is required, not id, no default
    expect(names).toContain('email')
    // updatedAt is required, not id, no default, but isUpdatedAt - still returned since the function does not check isUpdatedAt
    expect(names).toContain('updatedAt')
  })

  it('should exclude id fields', () => {
    const result = getRequiredFields(mockUserModel)
    const names = result.map(f => f.name)

    expect(names).not.toContain('id')
  })

  it('should exclude fields with default values', () => {
    const result = getRequiredFields(mockUserModel)
    const names = result.map(f => f.name)

    // role has default, isActive has default, createdAt has default
    expect(names).not.toContain('role')
    expect(names).not.toContain('isActive')
    expect(names).not.toContain('createdAt')
  })

  it('should exclude optional fields', () => {
    const result = getRequiredFields(mockUserModel)
    const names = result.map(f => f.name)

    // name is not required
    expect(names).not.toContain('name')
    // metadata is not required
    expect(names).not.toContain('metadata')
  })

  it('should return empty for model where all fields have defaults or are optional', () => {
    const model: Model = {
      name: 'AllDefaults',
      fields: [
        createField({ name: 'id', type: 'number', isId: true, hasDefaultValue: true }),
        createField({ name: 'status', type: 'string', isId: false, isRequired: true, hasDefaultValue: true })
      ]
    }

    expect(getRequiredFields(model)).toHaveLength(0)
  })
})

describe('getRelations', () => {
  it('should find relations between models', () => {
    const result = getRelations(mockSchema)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'UserPosts',
      from: 'User',
      to: 'Post',
      fromField: 'posts',
      toField: 'author'
    })
  })

  it('should not duplicate relations', () => {
    const result = getRelations(mockSchema)

    // UserPosts appears on both User.posts and Post.author, but should only be listed once
    const relationNames = result.map(r => r.name)
    expect(relationNames.filter(n => n === 'UserPosts')).toHaveLength(1)
  })

  it('should return empty array for schema with no relations', () => {
    const schema: Schema = {
      models: [
        {
          name: 'Simple',
          fields: [createField({ name: 'id', type: 'number' })]
        }
      ],
      enums: []
    }

    expect(getRelations(schema)).toEqual([])
  })

  it('should handle self-referencing relation (no other model match)', () => {
    const schema: Schema = {
      models: [
        {
          name: 'Category',
          fields: [
            createField({ name: 'id', type: 'number' }),
            createField({ name: 'parent', type: 'relation', isId: false, relationName: 'CategoryParent' }),
            createField({ name: 'children', type: 'relation', isId: false, isList: true, relationName: 'CategoryParent' })
          ]
        }
      ],
      enums: []
    }

    // Self-referencing: the "other side" would need m.name !== model.name, which fails for self-ref
    const result = getRelations(schema)
    expect(result).toEqual([])
  })

  it('should handle schema with no models', () => {
    const schema: Schema = { models: [], enums: [] }
    expect(getRelations(schema)).toEqual([])
  })
})
