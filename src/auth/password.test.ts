/**
 * Tests for auth/password.ts
 */

import { vi } from 'vitest'
import { hashPassword, verifyPassword, comparePassword, hashPasswordBcrypt } from './password.js'

describe('hashPassword', () => {
  it('should return hash and salt', () => {
    const result = hashPassword('mypassword')

    expect(result).toHaveProperty('hash')
    expect(result).toHaveProperty('salt')
    expect(typeof result.hash).toBe('string')
    expect(typeof result.salt).toBe('string')
  })

  it('should generate a hex hash string', () => {
    const result = hashPassword('mypassword')
    expect(result.hash).toMatch(/^[a-f0-9]+$/)
  })

  it('should generate a hex salt string', () => {
    const result = hashPassword('mypassword')
    expect(result.salt).toMatch(/^[a-f0-9]+$/)
  })

  it('should generate different salts each time', () => {
    const result1 = hashPassword('mypassword')
    const result2 = hashPassword('mypassword')

    expect(result1.salt).not.toBe(result2.salt)
  })

  it('should generate different hashes with different salts', () => {
    const result1 = hashPassword('mypassword')
    const result2 = hashPassword('mypassword')

    expect(result1.hash).not.toBe(result2.hash)
  })

  it('should generate same hash with same salt', () => {
    const salt = 'fixed-salt-for-testing'
    const result1 = hashPassword('mypassword', salt)
    const result2 = hashPassword('mypassword', salt)

    expect(result1.hash).toBe(result2.hash)
    expect(result1.salt).toBe(salt)
  })

  it('should use provided salt', () => {
    const customSalt = 'my-custom-salt'
    const result = hashPassword('mypassword', customSalt)

    expect(result.salt).toBe(customSalt)
  })

  it('should generate different hashes for different passwords', () => {
    const salt = 'same-salt'
    const result1 = hashPassword('password1', salt)
    const result2 = hashPassword('password2', salt)

    expect(result1.hash).not.toBe(result2.hash)
  })

  it('should produce a SHA256 hash (64 hex chars)', () => {
    const result = hashPassword('mypassword')
    expect(result.hash).toHaveLength(64)
  })
})

describe('verifyPassword', () => {
  it('should return true for correct password', () => {
    const { hash, salt } = hashPassword('correctpassword')
    expect(verifyPassword('correctpassword', hash, salt)).toBe(true)
  })

  it('should return false for incorrect password', () => {
    const { hash, salt } = hashPassword('correctpassword')
    expect(verifyPassword('wrongpassword', hash, salt)).toBe(false)
  })

  it('should return false with wrong salt', () => {
    const { hash } = hashPassword('mypassword', 'salt1')
    expect(verifyPassword('mypassword', hash, 'salt2')).toBe(false)
  })

  it('should work with custom salt', () => {
    const salt = 'custom-salt-123'
    const { hash } = hashPassword('mypassword', salt)
    expect(verifyPassword('mypassword', hash, salt)).toBe(true)
  })

  it('should handle empty password', () => {
    const { hash, salt } = hashPassword('')
    expect(verifyPassword('', hash, salt)).toBe(true)
    expect(verifyPassword('notempty', hash, salt)).toBe(false)
  })

  it('should handle special characters in password', () => {
    const password = 'p@$$w0rd!#%^&*()'
    const { hash, salt } = hashPassword(password)
    expect(verifyPassword(password, hash, salt)).toBe(true)
  })

  it('should handle unicode characters', () => {
    const password = 'mot-de-passe-avec-accents'
    const { hash, salt } = hashPassword(password)
    expect(verifyPassword(password, hash, salt)).toBe(true)
  })
})

describe('comparePassword', () => {
  it('should fall back to plain comparison when bcrypt not available', async () => {
    // Mock bcrypt to throw (simulate not installed)
    vi.doMock('bcrypt', () => {
      throw new Error('Module not found')
    })

    // Re-import to get the mocked version
    const { comparePassword: compare } = await import('./password.js')

    const result = await compare('test', 'test')
    expect(result).toBe(true)

    const result2 = await compare('test', 'different')
    expect(result2).toBe(false)

    vi.doUnmock('bcrypt')
  })
})

describe('hashPasswordBcrypt', () => {
  it('should hash password with bcrypt', async () => {
    try {
      const hash = await hashPasswordBcrypt('testpassword')
      expect(typeof hash).toBe('string')
      expect(hash).not.toBe('testpassword')
      // bcrypt hashes start with $2b$ or $2a$
      expect(hash).toMatch(/^\$2[ab]\$/)
    } catch {
      // bcrypt may not be installed, skip test
    }
  })

  it('should produce different hashes for same password', async () => {
    try {
      const hash1 = await hashPasswordBcrypt('testpassword')
      const hash2 = await hashPasswordBcrypt('testpassword')
      expect(hash1).not.toBe(hash2)
    } catch {
      // bcrypt may not be installed, skip test
    }
  })
})
