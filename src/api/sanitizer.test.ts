/**
 * Tests for api/sanitizer.ts
 */

import {
  convertFieldValue,
  sanitizeInput,
  validateRequired,
  validateInput,
  parseId,
  getModelClient
} from './sanitizer.js'
import { mockUserModel, mockPostModel, createField, createMockPrismaClient } from '../__tests__/fixtures.js'
import type { Model } from '../schema/types.js'

describe('getModelClient', () => {
  it('should convert PascalCase model name to camelCase key', () => {
    const prisma = createMockPrismaClient()

    const client = getModelClient(prisma, 'User')
    expect(client).toBe(prisma.user)
  })

  it('should handle model name starting with lowercase', () => {
    const prisma = createMockPrismaClient()

    const client = getModelClient(prisma, 'user')
    expect(client).toBe(prisma.user)
  })

  it('should handle Post model', () => {
    const prisma = createMockPrismaClient()

    const client = getModelClient(prisma, 'Post')
    expect(client).toBe(prisma.post)
  })
})

describe('convertFieldValue', () => {
  it('should return null as-is', () => {
    expect(convertFieldValue('string', null)).toBeNull()
  })

  it('should return undefined as-is', () => {
    expect(convertFieldValue('string', undefined)).toBeUndefined()
  })

  it('should convert string to number', () => {
    expect(convertFieldValue('number', '42')).toBe(42)
  })

  it('should convert float string to number', () => {
    expect(convertFieldValue('number', '3.14')).toBeCloseTo(3.14)
  })

  it('should keep number as number', () => {
    expect(convertFieldValue('number', 42)).toBe(42)
  })

  it('should convert "true" string to boolean true', () => {
    expect(convertFieldValue('boolean', 'true')).toBe(true)
  })

  it('should convert "false" string to boolean false', () => {
    expect(convertFieldValue('boolean', 'false')).toBe(false)
  })

  it('should convert truthy non-string to boolean', () => {
    expect(convertFieldValue('boolean', 1)).toBe(true)
  })

  it('should convert falsy non-string to boolean', () => {
    expect(convertFieldValue('boolean', 0)).toBe(false)
  })

  it('should convert string to Date', () => {
    const result = convertFieldValue('date', '2024-01-15')
    expect(result).toBeInstanceOf(Date)
    expect((result as Date).toISOString()).toContain('2024-01-15')
  })

  it('should keep Date as Date', () => {
    const date = new Date('2024-01-15')
    const result = convertFieldValue('date', date)
    expect(result).toBe(date)
  })

  it('should convert to BigInt', () => {
    const result = convertFieldValue('bigint', '9007199254740993')
    expect(result).toBe(BigInt('9007199254740993'))
  })

  it('should convert number to BigInt', () => {
    const result = convertFieldValue('bigint', 42)
    expect(result).toBe(BigInt(42))
  })

  it('should parse JSON string', () => {
    const result = convertFieldValue('json', '{"key":"value"}')
    expect(result).toEqual({ key: 'value' })
  })

  it('should keep object as-is for json type', () => {
    const obj = { key: 'value' }
    expect(convertFieldValue('json', obj)).toBe(obj)
  })

  it('should return string values as-is for string type', () => {
    expect(convertFieldValue('string', 'hello')).toBe('hello')
  })

  it('should return values as-is for enum type', () => {
    expect(convertFieldValue('enum', 'ADMIN')).toBe('ADMIN')
  })

  it('should return values as-is for relation type', () => {
    expect(convertFieldValue('relation', 'something')).toBe('something')
  })

  it('should return values as-is for decimal type', () => {
    expect(convertFieldValue('decimal', '10.5')).toBe('10.5')
  })

  it('should return values as-is for bytes type', () => {
    const buf = Buffer.from('hello')
    expect(convertFieldValue('bytes', buf)).toBe(buf)
  })
})

describe('sanitizeInput', () => {
  it('should only include scalar fields from input', () => {
    const result = sanitizeInput(mockUserModel, {
      email: 'test@example.com',
      name: 'John',
      posts: [{ id: 1 }] // relation field, should be excluded
    })

    expect(result.email).toBe('test@example.com')
    expect(result.name).toBe('John')
    expect(result.posts).toBeUndefined()
  })

  it('should exclude readonly fields', () => {
    const result = sanitizeInput(mockUserModel, {
      email: 'test@example.com',
      createdAt: '2024-01-01'
    }, ['createdAt'])

    expect(result.email).toBe('test@example.com')
    expect(result.createdAt).toBeUndefined()
  })

  it('should convert field values to correct types', () => {
    const result = sanitizeInput(mockUserModel, {
      email: 'test@example.com',
      isActive: 'true',
      createdAt: '2024-01-01'
    })

    expect(result.isActive).toBe(true)
    expect(result.createdAt).toBeInstanceOf(Date)
  })

  it('should ignore fields not in the model', () => {
    const result = sanitizeInput(mockUserModel, {
      email: 'test@example.com',
      unknownField: 'value'
    })

    expect(result.email).toBe('test@example.com')
    expect(result.unknownField).toBeUndefined()
  })

  it('should not include fields not present in data', () => {
    const result = sanitizeInput(mockUserModel, {
      email: 'test@example.com'
    })

    expect(Object.keys(result)).toEqual(['email'])
  })

  it('should handle empty data', () => {
    const result = sanitizeInput(mockUserModel, {})
    expect(result).toEqual({})
  })

  it('should handle empty readonlyFields array', () => {
    const result = sanitizeInput(mockUserModel, { email: 'test@example.com' }, [])
    expect(result.email).toBe('test@example.com')
  })
})

describe('validateRequired', () => {
  it('should return errors for missing required fields', () => {
    const errors = validateRequired(mockUserModel, {})

    // email is required, no default, not id
    expect(errors).toContain('email is required')
  })

  it('should not require fields with defaults', () => {
    const errors = validateRequired(mockUserModel, { email: 'test@test.com', updatedAt: new Date() })

    // role has default, isActive has default, createdAt has default
    expect(errors).not.toContain('role is required')
    expect(errors).not.toContain('isActive is required')
    expect(errors).not.toContain('createdAt is required')
  })

  it('should not require id fields', () => {
    const errors = validateRequired(mockUserModel, {})
    expect(errors).not.toContain('id is required')
  })

  it('should not require optional fields', () => {
    const errors = validateRequired(mockUserModel, { email: 'test@test.com', updatedAt: new Date() })
    expect(errors).not.toContain('name is required')
    expect(errors).not.toContain('metadata is required')
  })

  it('should return empty array when all required fields present', () => {
    const errors = validateRequired(mockUserModel, {
      email: 'test@test.com',
      updatedAt: new Date()
    })

    expect(errors).toHaveLength(0)
  })

  it('should check Post model required fields', () => {
    const errors = validateRequired(mockPostModel, {})

    expect(errors).toContain('title is required')
    expect(errors).toContain('authorId is required')
  })
})

describe('validateInput', () => {
  it('should return valid when all required fields present', () => {
    const result = validateInput(mockUserModel, {
      email: 'test@test.com',
      updatedAt: new Date()
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return invalid with missing required fields', () => {
    const result = validateInput(mockUserModel, {})

    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should skip required check when checkRequired is false', () => {
    const result = validateInput(mockUserModel, {}, { checkRequired: false })

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should check for unknown fields when allowedFields provided', () => {
    const result = validateInput(mockUserModel, {
      email: 'test@test.com',
      updatedAt: new Date(),
      badField: 'value'
    }, { allowedFields: ['email', 'updatedAt'] })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Unknown field: badField')
  })

  it('should pass when all fields are in allowedFields', () => {
    const result = validateInput(mockUserModel, {
      email: 'test@test.com',
      updatedAt: new Date()
    }, { allowedFields: ['email', 'updatedAt'] })

    expect(result.isValid).toBe(true)
  })

  it('should combine required and unknown field errors', () => {
    const result = validateInput(mockUserModel, {
      badField: 'value'
    }, { allowedFields: ['email'] })

    expect(result.isValid).toBe(false)
    // Should have both required field error and unknown field error
    expect(result.errors.some(e => e.includes('required'))).toBe(true)
    expect(result.errors.some(e => e.includes('Unknown field'))).toBe(true)
  })
})

describe('parseId', () => {
  it('should parse string id to number when id field is number type', () => {
    expect(parseId(mockUserModel, '42')).toBe(42)
  })

  it('should keep number id as number', () => {
    expect(parseId(mockUserModel, 42)).toBe(42)
  })

  it('should keep string id as string for non-number id fields', () => {
    const model: Model = {
      name: 'Doc',
      fields: [
        createField({ name: 'id', type: 'string', isId: true })
      ]
    }

    expect(parseId(model, 'abc-123')).toBe('abc-123')
  })

  it('should throw when model has no id field', () => {
    const model: Model = {
      name: 'NoId',
      fields: [
        createField({ name: 'name', type: 'string', isId: false })
      ]
    }

    expect(() => parseId(model, '1')).toThrow('Model "NoId" has no id field')
  })

  it('should parse numeric string for number type id', () => {
    expect(parseId(mockUserModel, '0')).toBe(0)
  })
})
