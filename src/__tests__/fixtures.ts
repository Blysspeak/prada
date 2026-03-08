/**
 * Shared test fixtures for backend tests
 */

import { vi } from 'vitest'
import type { Schema, Model, Field, Enum } from '../schema/types.js'
import type { Request, Response, NextFunction } from 'express'

// =============================================================================
// FIELD FACTORIES
// =============================================================================

export function createField(overrides: Partial<Field> = {}): Field {
  return {
    name: 'id',
    type: 'number',
    isRequired: true,
    isList: false,
    isUnique: true,
    isId: true,
    isUpdatedAt: false,
    hasDefaultValue: true,
    default: { name: 'autoincrement', args: [] },
    ...overrides
  }
}

// =============================================================================
// MODEL FIXTURES
// =============================================================================

export const mockUserModel: Model = {
  name: 'User',
  fields: [
    createField({ name: 'id', type: 'number', isId: true, isRequired: true, isUnique: true, hasDefaultValue: true }),
    createField({ name: 'email', type: 'string', isId: false, isRequired: true, isUnique: true, hasDefaultValue: false }),
    createField({ name: 'name', type: 'string', isId: false, isRequired: false, isUnique: false, hasDefaultValue: false }),
    createField({ name: 'role', type: 'enum', isId: false, isRequired: true, isUnique: false, hasDefaultValue: true, enumValues: ['ADMIN', 'USER', 'VIEWER'] }),
    createField({ name: 'isActive', type: 'boolean', isId: false, isRequired: true, isUnique: false, hasDefaultValue: true, default: true }),
    createField({ name: 'createdAt', type: 'date', isId: false, isRequired: true, isUnique: false, hasDefaultValue: true }),
    createField({ name: 'updatedAt', type: 'date', isId: false, isRequired: true, isUnique: false, hasDefaultValue: false, isUpdatedAt: true }),
    createField({ name: 'metadata', type: 'json', isId: false, isRequired: false, isUnique: false, hasDefaultValue: false }),
    createField({
      name: 'posts',
      type: 'relation',
      isId: false,
      isRequired: false,
      isList: true,
      isUnique: false,
      hasDefaultValue: false,
      relationName: 'UserPosts'
    })
  ]
}

export const mockPostModel: Model = {
  name: 'Post',
  fields: [
    createField({ name: 'id', type: 'number', isId: true, isRequired: true, hasDefaultValue: true }),
    createField({ name: 'title', type: 'string', isId: false, isRequired: true, isUnique: false, hasDefaultValue: false }),
    createField({ name: 'content', type: 'string', isId: false, isRequired: false, isUnique: false, hasDefaultValue: false }),
    createField({ name: 'authorId', type: 'number', isId: false, isRequired: true, isUnique: false, hasDefaultValue: false }),
    createField({
      name: 'author',
      type: 'relation',
      isId: false,
      isRequired: true,
      isUnique: false,
      hasDefaultValue: false,
      relationName: 'UserPosts',
      relationFromFields: ['authorId'],
      relationToFields: ['id']
    })
  ]
}

export const mockRoleEnum: Enum = {
  name: 'Role',
  values: ['ADMIN', 'USER', 'VIEWER']
}

export const mockSchema: Schema = {
  models: [mockUserModel, mockPostModel],
  enums: [mockRoleEnum]
}

// =============================================================================
// MOCK PRISMA CLIENT
// =============================================================================

export function createMockPrismaClient() {
  return {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
      delete: vi.fn().mockResolvedValue({ id: 1 })
    },
    post: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
      delete: vi.fn().mockResolvedValue({ id: 1 })
    }
  } as any
}

// =============================================================================
// MOCK EXPRESS
// =============================================================================

export function createMockReq(overrides: Record<string, any> = {}): Request {
  return {
    headers: {},
    cookies: {},
    params: {},
    query: {},
    body: {},
    path: '/',
    user: undefined,
    ...overrides
  } as unknown as Request
}

export function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    sendFile: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis()
  } as unknown as Response
  return res
}

export function createMockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction
}
