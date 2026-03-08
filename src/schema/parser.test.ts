/**
 * Tests for schema/parser.ts
 */

import { vi } from 'vitest'

// Mock @prisma/internals
vi.mock('@prisma/internals', () => ({
  default: {
    getDMMF: vi.fn()
  }
}))

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn()
}))

import prismaInternals from '@prisma/internals'
import { readFileSync, existsSync, statSync, readdirSync } from 'fs'
import { parseDMMF, parseSchema } from './parser.js'

const mockGetDMMF = prismaInternals.getDMMF as ReturnType<typeof vi.fn>
const mockReadFileSync = readFileSync as ReturnType<typeof vi.fn>
const mockExistsSync = existsSync as ReturnType<typeof vi.fn>
const mockStatSync = statSync as ReturnType<typeof vi.fn>
const mockReaddirSync = readdirSync as ReturnType<typeof vi.fn>

function createDMMFResult(models: any[] = [], enums: any[] = []) {
  return {
    datamodel: {
      models,
      enums
    }
  }
}

describe('parseDMMF', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should parse an empty schema', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult())

    const result = await parseDMMF('datasource db {}')

    expect(result).toEqual({ models: [], enums: [] })
    expect(mockGetDMMF).toHaveBeenCalledWith({ datamodel: 'datasource db {}' })
  })

  it('should parse enums with values', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([], [
      {
        name: 'Role',
        values: [{ name: 'ADMIN' }, { name: 'USER' }, { name: 'VIEWER' }],
        documentation: 'User roles'
      }
    ]))

    const result = await parseDMMF('enum Role {}')

    expect(result.enums).toHaveLength(1)
    expect(result.enums[0]).toEqual({
      name: 'Role',
      values: ['ADMIN', 'USER', 'VIEWER'],
      documentation: 'User roles'
    })
  })

  it('should parse enums without documentation', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([], [
      {
        name: 'Status',
        values: [{ name: 'ACTIVE' }, { name: 'INACTIVE' }]
      }
    ]))

    const result = await parseDMMF('enum Status {}')

    expect(result.enums[0].documentation).toBeUndefined()
  })

  it('should map String type to string', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'email', type: 'String', isRequired: true, isList: false, isUnique: true, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('string')
  })

  it('should map Int type to number', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'age', type: 'Int', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('number')
  })

  it('should map Float type to number', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'Product',
        fields: [
          { name: 'price', type: 'Float', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model Product {}')
    expect(result.models[0].fields[0].type).toBe('number')
  })

  it('should map Boolean type to boolean', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'isActive', type: 'Boolean', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('boolean')
  })

  it('should map DateTime type to date', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'createdAt', type: 'DateTime', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: true }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('date')
  })

  it('should map BigInt type to bigint', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'Item',
        fields: [
          { name: 'bigVal', type: 'BigInt', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model Item {}')
    expect(result.models[0].fields[0].type).toBe('bigint')
  })

  it('should map Decimal type to decimal', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'Product',
        fields: [
          { name: 'price', type: 'Decimal', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model Product {}')
    expect(result.models[0].fields[0].type).toBe('decimal')
  })

  it('should map Json type to json', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'metadata', type: 'Json', isRequired: false, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('json')
  })

  it('should map Bytes type to bytes', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'File',
        fields: [
          { name: 'data', type: 'Bytes', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model File {}')
    expect(result.models[0].fields[0].type).toBe('bytes')
  })

  it('should detect enum fields', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult(
      [
        {
          name: 'User',
          fields: [
            { name: 'role', type: 'Role', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: true, default: 'USER' }
          ]
        }
      ],
      [
        { name: 'Role', values: [{ name: 'ADMIN' }, { name: 'USER' }] }
      ]
    ))

    const result = await parseDMMF('model User {}')
    const roleField = result.models[0].fields[0]

    expect(roleField.type).toBe('enum')
    expect(roleField.enumValues).toEqual(['ADMIN', 'USER'])
  })

  it('should detect relation fields', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          {
            name: 'posts',
            type: 'Post',
            isRequired: false,
            isList: true,
            isUnique: false,
            isId: false,
            hasDefaultValue: false,
            relationName: 'UserPosts',
            relationFromFields: [],
            relationToFields: []
          }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    const postsField = result.models[0].fields[0]

    expect(postsField.type).toBe('relation')
    expect(postsField.relationName).toBe('UserPosts')
    expect(postsField.isList).toBe(true)
  })

  it('should parse relation with from/to fields', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'Post',
        fields: [
          {
            name: 'author',
            type: 'User',
            isRequired: true,
            isList: false,
            isUnique: false,
            isId: false,
            hasDefaultValue: false,
            relationName: 'UserPosts',
            relationFromFields: ['authorId'],
            relationToFields: ['id'],
            relationOnDelete: 'CASCADE'
          }
        ]
      }
    ]))

    const result = await parseDMMF('model Post {}')
    const authorField = result.models[0].fields[0]

    expect(authorField.relationFromFields).toEqual(['authorId'])
    expect(authorField.relationToFields).toEqual(['id'])
    expect(authorField.relationOnDelete).toBe('CASCADE')
  })

  it('should parse model with dbName', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        dbName: 'users',
        fields: []
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].dbName).toBe('users')
  })

  it('should set dbName to undefined when null', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        dbName: null,
        fields: []
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].dbName).toBeUndefined()
  })

  it('should parse model documentation', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        documentation: 'The user model',
        fields: []
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].documentation).toBe('The user model')
  })

  it('should parse field documentation', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'email', type: 'String', isRequired: true, isList: false, isUnique: true, isId: false, hasDefaultValue: false, documentation: 'User email address' }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].documentation).toBe('User email address')
  })

  it('should parse primaryKey', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'UserRole',
        fields: [],
        primaryKey: { fields: ['userId', 'roleId'] }
      }
    ]))

    const result = await parseDMMF('model UserRole {}')
    expect(result.models[0].primaryKey).toEqual(['userId', 'roleId'])
  })

  it('should parse uniqueFields', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [],
        uniqueFields: [['firstName', 'lastName']]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].uniqueFields).toEqual([['firstName', 'lastName']])
  })

  it('should set isUpdatedAt to false when not present', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'name', type: 'String', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].isUpdatedAt).toBe(false)
  })

  it('should set isUpdatedAt to true when present', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'updatedAt', type: 'DateTime', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false, isUpdatedAt: true }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].isUpdatedAt).toBe(true)
  })

  it('should parse field default value', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'isActive', type: 'Boolean', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: true, default: true }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].default).toBe(true)
  })

  it('should handle unknown prisma types as relation', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'profile', type: 'Profile', isRequired: false, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].type).toBe('relation')
  })

  it('should not set enumValues for non-enum fields', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      {
        name: 'User',
        fields: [
          { name: 'name', type: 'String', isRequired: true, isList: false, isUnique: false, isId: false, hasDefaultValue: false }
        ]
      }
    ]))

    const result = await parseDMMF('model User {}')
    expect(result.models[0].fields[0].enumValues).toBeUndefined()
  })

  it('should parse multiple models and enums', async () => {
    mockGetDMMF.mockResolvedValue(createDMMFResult(
      [
        { name: 'User', fields: [{ name: 'id', type: 'Int', isRequired: true, isList: false, isUnique: true, isId: true, hasDefaultValue: true }] },
        { name: 'Post', fields: [{ name: 'id', type: 'Int', isRequired: true, isList: false, isUnique: true, isId: true, hasDefaultValue: true }] }
      ],
      [
        { name: 'Role', values: [{ name: 'ADMIN' }] },
        { name: 'Status', values: [{ name: 'ACTIVE' }, { name: 'INACTIVE' }] }
      ]
    ))

    const result = await parseDMMF('schema content')

    expect(result.models).toHaveLength(2)
    expect(result.enums).toHaveLength(2)
    expect(result.models[0].name).toBe('User')
    expect(result.models[1].name).toBe('Post')
    expect(result.enums[0].name).toBe('Role')
    expect(result.enums[1].name).toBe('Status')
  })
})

describe('parseSchema', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should throw if schema path not found', async () => {
    mockExistsSync.mockReturnValue(false)

    await expect(parseSchema('/nonexistent/schema.prisma')).rejects.toThrow(
      'Schema path not found'
    )
  })

  it('should read a single file schema', async () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ isDirectory: () => false })
    mockReadFileSync.mockReturnValue('model User { id Int @id }')
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      { name: 'User', fields: [{ name: 'id', type: 'Int', isRequired: true, isList: false, isUnique: true, isId: true, hasDefaultValue: true }] }
    ]))

    const result = await parseSchema('/path/to/schema.prisma')

    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('schema.prisma'), 'utf-8')
    expect(result.models).toHaveLength(1)
  })

  it('should read a directory of .prisma files', async () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ isDirectory: () => true })
    mockReaddirSync.mockReturnValue(['01-user.prisma', '02-post.prisma'])
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes('01-user')) return 'model User { id Int @id }'
      if (path.includes('02-post')) return 'model Post { id Int @id }'
      return ''
    })
    mockGetDMMF.mockResolvedValue(createDMMFResult([
      { name: 'User', fields: [] },
      { name: 'Post', fields: [] }
    ]))

    const result = await parseSchema('/path/to/schema')

    expect(mockReaddirSync).toHaveBeenCalled()
    expect(result.models).toHaveLength(2)
  })

  it('should throw if directory has no .prisma files', async () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ isDirectory: () => true })
    mockReaddirSync.mockReturnValue(['readme.md', 'config.json'])

    await expect(parseSchema('/path/to/schema')).rejects.toThrow(
      'No .prisma files found in directory'
    )
  })

  it('should sort directory files alphabetically', async () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ isDirectory: () => true })
    mockReaddirSync.mockReturnValue(['c.prisma', 'a.prisma', 'b.prisma'])
    mockReadFileSync.mockReturnValue('model X {}')
    mockGetDMMF.mockResolvedValue(createDMMFResult())

    await parseSchema('/path/to/schema')

    const calls = mockReadFileSync.mock.calls
    expect(calls[0][0]).toContain('a.prisma')
    expect(calls[1][0]).toContain('b.prisma')
    expect(calls[2][0]).toContain('c.prisma')
  })

  it('should filter non-.prisma files from directory', async () => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue({ isDirectory: () => true })
    mockReaddirSync.mockReturnValue(['model.prisma', 'readme.md', 'schema.ts'])
    mockReadFileSync.mockReturnValue('model X {}')
    mockGetDMMF.mockResolvedValue(createDMMFResult())

    await parseSchema('/path/to/schema')

    expect(mockReadFileSync).toHaveBeenCalledTimes(1)
  })

  it('should search common paths when no schema path provided', async () => {
    // First call for each common path returns false, except for the last fallback
    mockExistsSync.mockReturnValueOnce(false) // prisma/schema.prisma
      .mockReturnValueOnce(false) // prisma/schema
      .mockReturnValueOnce(false) // schema.prisma
      .mockReturnValueOnce(false) // src/prisma/schema.prisma
      .mockReturnValueOnce(false) // the final resolved path check in parseSchema

    await expect(parseSchema()).rejects.toThrow('Schema path not found')
  })

  it('should use first found common path', async () => {
    mockExistsSync.mockReturnValueOnce(true) // prisma/schema.prisma exists
      .mockReturnValueOnce(true) // the path check in parseSchema
    mockStatSync.mockReturnValue({ isDirectory: () => false })
    mockReadFileSync.mockReturnValue('model User {}')
    mockGetDMMF.mockResolvedValue(createDMMFResult())

    await parseSchema()

    expect(mockReadFileSync).toHaveBeenCalled()
  })
})
