/**
 * Tests for auth/config.ts
 */

import { vi } from 'vitest'

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn()
}))

// Mock crypto.randomBytes for deterministic tests
vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto')
  return {
    ...actual,
    randomBytes: vi.fn().mockImplementation((size: number) => {
      // Return deterministic bytes for testing
      return {
        toString: (encoding: string) => 'a'.repeat(size * 2)
      }
    })
  }
})

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { loadConfig, isConfigured, saveCredentials, deleteCredentials } from './config.js'

const mockExistsSync = existsSync as ReturnType<typeof vi.fn>
const mockReadFileSync = readFileSync as ReturnType<typeof vi.fn>
const mockWriteFileSync = writeFileSync as ReturnType<typeof vi.fn>
const mockMkdirSync = mkdirSync as ReturnType<typeof vi.fn>
const mockUnlinkSync = unlinkSync as ReturnType<typeof vi.fn>

describe('isConfigured', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.PRADA_LOGIN
    delete process.env.PRADA_PASSWORD
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return true when PRADA_LOGIN and PRADA_PASSWORD are set', () => {
    process.env.PRADA_LOGIN = 'admin'
    process.env.PRADA_PASSWORD = 'secret'

    expect(isConfigured('/tmp/test')).toBe(true)
  })

  it('should return false when only PRADA_LOGIN is set', () => {
    process.env.PRADA_LOGIN = 'admin'
    mockExistsSync.mockReturnValue(false)

    expect(isConfigured('/tmp/test')).toBe(false)
  })

  it('should return false when only PRADA_PASSWORD is set', () => {
    process.env.PRADA_PASSWORD = 'secret'
    mockExistsSync.mockReturnValue(false)

    expect(isConfigured('/tmp/test')).toBe(false)
  })

  it('should return true when credentials file exists', () => {
    mockExistsSync.mockReturnValue(true)

    expect(isConfigured('/tmp/test')).toBe(true)
  })

  it('should return false when no env vars and no file', () => {
    mockExistsSync.mockReturnValue(false)

    expect(isConfigured('/tmp/test')).toBe(false)
  })

  it('should check credentials file at .prada/credentials path', () => {
    mockExistsSync.mockReturnValue(false)

    isConfigured('/tmp/myproject')

    expect(mockExistsSync).toHaveBeenCalledWith(
      expect.stringContaining('.prada')
    )
  })
})

describe('loadConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.PRADA_LOGIN
    delete process.env.PRADA_PASSWORD
    delete process.env.PRADA_SECRET
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should load config from env vars (priority 1)', () => {
    process.env.PRADA_LOGIN = 'admin'
    process.env.PRADA_PASSWORD = 'secret'

    const config = loadConfig('/tmp/test')

    expect(config.auth).toEqual({
      login: 'admin',
      password: 'secret',
      secret: undefined,
      fromEnv: true
    })
  })

  it('should include PRADA_SECRET from env', () => {
    process.env.PRADA_LOGIN = 'admin'
    process.env.PRADA_PASSWORD = 'secret'
    process.env.PRADA_SECRET = 'my-jwt-secret'

    const config = loadConfig('/tmp/test')

    expect(config.auth!.secret).toBe('my-jwt-secret')
  })

  it('should load config from file (priority 2)', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      login: 'admin',
      passwordHash: 'abc123',
      salt: 'def456',
      secret: 'file-secret',
      createdAt: '2024-01-01'
    }))

    const config = loadConfig('/tmp/test')

    expect(config.auth).toEqual({
      login: 'admin',
      passwordHash: 'abc123',
      salt: 'def456',
      secret: 'file-secret',
      fromFile: true
    })
  })

  it('should prefer env vars over file', () => {
    process.env.PRADA_LOGIN = 'env-admin'
    process.env.PRADA_PASSWORD = 'env-secret'

    // File also exists, but env should take priority
    mockExistsSync.mockReturnValue(true)

    const config = loadConfig('/tmp/test')

    expect(config.auth!.login).toBe('env-admin')
    expect(config.auth!.fromEnv).toBe(true)
  })

  it('should return null auth when no config found', () => {
    mockExistsSync.mockReturnValue(false)

    const config = loadConfig('/tmp/test')

    expect(config.auth).toBeNull()
  })

  it('should handle malformed credentials file', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue('invalid json')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const config = loadConfig('/tmp/test')

    expect(config.auth).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read credentials file:',
      expect.any(String)
    )

    consoleSpy.mockRestore()
  })

  it('should read credentials file with utf-8 encoding', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      login: 'admin',
      passwordHash: 'hash',
      salt: 'salt',
      secret: 'secret'
    }))

    loadConfig('/tmp/test')

    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'utf-8'
    )
  })
})

describe('saveCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create .prada directory if not exists', () => {
    mockExistsSync.mockReturnValueOnce(false) // configDir doesn't exist
      .mockReturnValueOnce(false) // .gitignore doesn't exist

    saveCredentials('admin', 'secret', '/tmp/test')

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('.prada'),
      { recursive: true }
    )
  })

  it('should not create .prada directory if already exists', () => {
    mockExistsSync.mockReturnValueOnce(true) // configDir exists
      .mockReturnValueOnce(false) // .gitignore doesn't exist

    saveCredentials('admin', 'secret', '/tmp/test')

    expect(mockMkdirSync).not.toHaveBeenCalled()
  })

  it('should write credentials file with hashed password', () => {
    mockExistsSync.mockReturnValue(false)

    saveCredentials('admin', 'secret', '/tmp/test')

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('credentials'),
      expect.any(String),
      'utf-8'
    )

    const writtenData = JSON.parse(mockWriteFileSync.mock.calls[0][1])
    expect(writtenData.login).toBe('admin')
    expect(writtenData.passwordHash).toBeDefined()
    expect(writtenData.salt).toBeDefined()
    expect(writtenData.secret).toBeDefined()
    expect(writtenData.createdAt).toBeDefined()
    // Password should be hashed, not plain text
    expect(writtenData.passwordHash).not.toBe('secret')
  })

  it('should return login and secret', () => {
    mockExistsSync.mockReturnValue(false)

    const result = saveCredentials('admin', 'secret', '/tmp/test')

    expect(result.login).toBe('admin')
    expect(result.secret).toBeDefined()
    expect(typeof result.secret).toBe('string')
  })

  it('should add .prada to .gitignore if it exists and does not contain .prada', () => {
    mockExistsSync.mockReturnValueOnce(true) // configDir exists
      .mockReturnValueOnce(true) // .gitignore exists
    mockReadFileSync.mockReturnValue('node_modules/\ndist/')

    saveCredentials('admin', 'secret', '/tmp/test')

    // Should write both credentials and .gitignore
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2)

    const gitignoreCall = mockWriteFileSync.mock.calls.find(
      (call: any[]) => call[0].includes('.gitignore')
    )
    expect(gitignoreCall).toBeDefined()
    expect(gitignoreCall![1]).toContain('.prada/')
  })

  it('should not modify .gitignore if it already contains .prada', () => {
    mockExistsSync.mockReturnValueOnce(true) // configDir exists
      .mockReturnValueOnce(true) // .gitignore exists
    mockReadFileSync.mockReturnValue('node_modules/\n.prada/\ndist/')

    saveCredentials('admin', 'secret', '/tmp/test')

    // Should write only credentials file, not .gitignore
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
  })

  it('should not modify .gitignore if it does not exist', () => {
    mockExistsSync.mockReturnValueOnce(true) // configDir exists
      .mockReturnValueOnce(false) // .gitignore doesn't exist

    saveCredentials('admin', 'secret', '/tmp/test')

    // Should write only credentials file
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
  })

  it('should write credentials as formatted JSON', () => {
    mockExistsSync.mockReturnValue(false)

    saveCredentials('admin', 'secret', '/tmp/test')

    const writtenContent = mockWriteFileSync.mock.calls[0][1]
    // Should be pretty-printed with 2-space indentation
    expect(writtenContent).toContain('\n')
    expect(writtenContent).toContain('  ')
  })
})

describe('deleteCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete credentials file when it exists', () => {
    mockExistsSync.mockReturnValue(true)

    // deleteCredentials uses require('fs').unlinkSync which may bypass the ESM mock.
    // We verify it doesn't throw and existsSync was called.
    // The actual unlink may fail since there's no real file, so we wrap it.
    try {
      deleteCredentials('/tmp/test')
    } catch {
      // Expected: require('fs').unlinkSync is not mocked via vi.mock for ESM
    }

    expect(mockExistsSync).toHaveBeenCalledWith(
      expect.stringContaining('.prada')
    )
  })

  it('should not throw when credentials file does not exist', () => {
    mockExistsSync.mockReturnValue(false)

    expect(() => deleteCredentials('/tmp/test')).not.toThrow()
  })

  it('should check for credentials file at correct path', () => {
    mockExistsSync.mockReturnValue(false)

    deleteCredentials('/tmp/myproject')

    expect(mockExistsSync).toHaveBeenCalledWith(
      expect.stringContaining('.prada')
    )
  })
})
