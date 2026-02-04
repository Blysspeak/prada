/**
 * Config Management
 *
 * Functions for loading and saving authentication configuration.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { randomBytes } from 'crypto'
import { hashPassword } from './password.js'
import type { LoadedConfig, CredentialsConfig } from './types.js'

const CONFIG_DIR = '.prada'
const CREDENTIALS_FILE = 'credentials'

/**
 * Get config directory path
 */
function getConfigPath(cwd: string = process.cwd()): string {
  return resolve(cwd, CONFIG_DIR)
}

/**
 * Get credentials file path
 */
function getCredentialsPath(cwd: string = process.cwd()): string {
  return resolve(getConfigPath(cwd), CREDENTIALS_FILE)
}

/**
 * Check if credentials are configured
 *
 * @param cwd - Working directory (default: process.cwd())
 * @returns True if configured via env vars or file
 *
 * @example
 * ```typescript
 * if (!isConfigured()) {
 *   // Show setup wizard
 * }
 * ```
 */
export function isConfigured(cwd: string = process.cwd()): boolean {
  // First check .env
  if (process.env.PRADA_LOGIN && process.env.PRADA_PASSWORD) {
    return true
  }
  // Then check local file
  return existsSync(getCredentialsPath(cwd))
}

/**
 * Load config from environment variables or local file
 *
 * @param cwd - Working directory (default: process.cwd())
 * @returns Loaded configuration
 *
 * @example
 * ```typescript
 * const config = loadConfig()
 * if (config.auth) {
 *   const auth = createAuthServiceFromConfig(config)
 * }
 * ```
 */
export function loadConfig(cwd: string = process.cwd()): LoadedConfig {
  // Priority 1: Environment variables
  if (process.env.PRADA_LOGIN && process.env.PRADA_PASSWORD) {
    return {
      auth: {
        login: process.env.PRADA_LOGIN,
        password: process.env.PRADA_PASSWORD,
        secret: process.env.PRADA_SECRET,
        fromEnv: true
      }
    }
  }

  // Priority 2: Local credentials file
  const credPath = getCredentialsPath(cwd)
  if (existsSync(credPath)) {
    try {
      const data: CredentialsConfig = JSON.parse(readFileSync(credPath, 'utf-8'))
      return {
        auth: {
          login: data.login,
          passwordHash: data.passwordHash,
          salt: data.salt,
          secret: data.secret,
          fromFile: true
        }
      }
    } catch (e) {
      console.error('Failed to read credentials file:', (e as Error).message)
    }
  }

  return { auth: null }
}

/**
 * Save credentials to local file
 *
 * @param login - Admin login
 * @param password - Admin password (will be hashed)
 * @param cwd - Working directory (default: process.cwd())
 * @returns Object with login and generated secret
 *
 * @example
 * ```typescript
 * const { login, secret } = saveCredentials('admin', 'secret123')
 * console.log('JWT secret:', secret)
 * ```
 */
export function saveCredentials(
  login: string,
  password: string,
  cwd: string = process.cwd()
): { login: string; secret: string } {
  const configDir = getConfigPath(cwd)
  const credPath = getCredentialsPath(cwd)

  // Create .prada directory if not exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  // Hash password
  const { hash, salt } = hashPassword(password)

  // Generate JWT secret
  const secret = randomBytes(32).toString('hex')

  const data: CredentialsConfig = {
    login,
    passwordHash: hash,
    salt,
    secret,
    createdAt: new Date().toISOString()
  }

  writeFileSync(credPath, JSON.stringify(data, null, 2), 'utf-8')

  // Add to .gitignore if not already there
  const gitignorePath = resolve(cwd, '.gitignore')
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8')
    if (!gitignore.includes('.prada')) {
      writeFileSync(gitignorePath, gitignore + '\n.prada/\n', 'utf-8')
    }
  }

  return { login, secret }
}

/**
 * Delete stored credentials
 *
 * @param cwd - Working directory (default: process.cwd())
 */
export function deleteCredentials(cwd: string = process.cwd()): void {
  const credPath = getCredentialsPath(cwd)
  if (existsSync(credPath)) {
    const { unlinkSync } = require('fs')
    unlinkSync(credPath)
  }
}
