/**
 * Shared test fixtures for UI tests
 */

import type { PradaField, PradaModel, PradaSchema } from '../types'

export function createMockField(overrides: Partial<PradaField> = {}): PradaField {
  return {
    name: 'id',
    type: 'number',
    isRequired: true,
    isList: false,
    isUnique: true,
    isId: true,
    isUpdatedAt: false,
    hasDefaultValue: true,
    ...overrides
  }
}

export const mockUserModel: PradaModel = {
  name: 'User',
  fields: [
    createMockField({ name: 'id', type: 'number', isId: true }),
    createMockField({ name: 'email', type: 'string', isId: false, hasDefaultValue: false }),
    createMockField({ name: 'name', type: 'string', isId: false, isRequired: false, hasDefaultValue: false }),
    createMockField({ name: 'role', type: 'enum', isId: false, hasDefaultValue: true, enumValues: ['ADMIN', 'USER'] }),
    createMockField({ name: 'isActive', type: 'boolean', isId: false, hasDefaultValue: true }),
    createMockField({ name: 'createdAt', type: 'date', isId: false, hasDefaultValue: true }),
    createMockField({ name: 'metadata', type: 'json', isId: false, isRequired: false, hasDefaultValue: false }),
    createMockField({
      name: 'posts',
      type: 'relation',
      isId: false,
      isRequired: false,
      isList: true,
      hasDefaultValue: false,
      relationName: 'UserPosts'
    })
  ]
}

export const mockPostModel: PradaModel = {
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'number', isId: true }),
    createMockField({ name: 'title', type: 'string', isId: false, isRequired: true, hasDefaultValue: false }),
    createMockField({ name: 'content', type: 'string', isId: false, isRequired: false, hasDefaultValue: false })
  ]
}

export const mockSchema: PradaSchema = {
  models: [mockUserModel, mockPostModel],
  enums: [
    { name: 'Role', values: ['ADMIN', 'USER'] }
  ]
}
