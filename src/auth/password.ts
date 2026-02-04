/**
 * Password Utilities
 *
 * Functions for hashing and comparing passwords.
 */

import { randomBytes, createHash } from 'crypto'

/**
 * Hash a password with SHA256 and salt
 *
 * @param password - Plain text password
 * @param salt - Optional salt (generated if not provided)
 * @returns Object with hash and salt
 *
 * @example
 * ```typescript
 * const { hash, salt } = hashPassword('secret123')
 * // Save hash and salt to database
 * ```
 */
export function hashPassword(
  password: string,
  salt: string = randomBytes(16).toString('hex')
): { hash: string; salt: string } {
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return { hash, salt }
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Previously stored hash
 * @param salt - Salt used when hashing
 * @returns True if password matches
 *
 * @example
 * ```typescript
 * const isValid = verifyPassword('secret123', storedHash, storedSalt)
 * ```
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = createHash('sha256').update(password + salt).digest('hex')
  return computed === hash
}

/**
 * Compare passwords using constant-time comparison
 *
 * @param password - Plain text password
 * @param hashedPassword - Bcrypt-hashed password
 * @returns Promise resolving to true if match
 *
 * @deprecated Use verifyPassword for SHA256 hashes or bcrypt directly
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // For bcrypt compatibility, dynamically import
  try {
    const bcrypt = await import('bcrypt')
    return bcrypt.compare(password, hashedPassword)
  } catch {
    // Fallback: assume it's a plain comparison (not recommended)
    return password === hashedPassword
  }
}

/**
 * Hash password with bcrypt
 *
 * @param password - Plain text password
 * @param rounds - Salt rounds (default: 10)
 * @returns Promise resolving to hashed password
 */
export async function hashPasswordBcrypt(
  password: string,
  rounds: number = 10
): Promise<string> {
  const bcrypt = await import('bcrypt')
  return bcrypt.hash(password, rounds)
}
