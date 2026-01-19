import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { randomBytes, createHash } from 'crypto'

const CONFIG_DIR = '.prada'
const CREDENTIALS_FILE = 'credentials'

/**
 * Get config directory path
 */
function getConfigPath(cwd = process.cwd()) {
  return resolve(cwd, CONFIG_DIR)
}

/**
 * Get credentials file path
 */
function getCredentialsPath(cwd = process.cwd()) {
  return resolve(getConfigPath(cwd), CREDENTIALS_FILE)
}

/**
 * Hash password with salt
 */
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return { hash, salt }
}

/**
 * Verify password against hash
 */
function verifyPassword(password, hash, salt) {
  const computed = createHash('sha256').update(password + salt).digest('hex')
  return computed === hash
}

/**
 * Check if credentials are configured
 */
export function isConfigured(cwd = process.cwd()) {
  // First check .env
  if (process.env.PRADA_LOGIN && process.env.PRADA_PASSWORD) {
    return true
  }
  // Then check local file
  return existsSync(getCredentialsPath(cwd))
}

/**
 * Load config from .env or local .prada/credentials file
 */
export function loadConfig(cwd = process.cwd()) {
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
      const data = JSON.parse(readFileSync(credPath, 'utf-8'))
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
      console.error('Failed to read credentials file:', e.message)
    }
  }

  return { auth: null }
}

/**
 * Save credentials to local .prada/credentials file
 */
export function saveCredentials(login, password, cwd = process.cwd()) {
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

  const data = {
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
 * Validate credentials against stored config
 */
export function validateCredentials(login, password, config) {
  if (!config.auth) return null

  // From .env - plain text comparison
  if (config.auth.fromEnv) {
    if (login === config.auth.login && password === config.auth.password) {
      return { login, role: 'admin' }
    }
    return null
  }

  // From file - hash comparison
  if (config.auth.fromFile) {
    if (login === config.auth.login &&
        verifyPassword(password, config.auth.passwordHash, config.auth.salt)) {
      return { login, role: 'admin' }
    }
    return null
  }

  return null
}
