import bcrypt from 'bcryptjs'
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto'

const BCRYPT_ROUNDS = 12
const PBKDF2_ITERATIONS = 100_000
const PBKDF2_KEY_LENGTH = 32       // 256 bits for AES-256
const PBKDF2_DIGEST = 'sha512'

/**
 * In-memory session key — never persisted to disk.
 * Set after successful login, cleared on lock/quit.
 */
let sessionKey: Buffer | null = null

// ─── Password Hashing ─────────────────────────────────────────

/**
 * Hash a plaintext password using bcrypt with a random salt.
 * Returns the hash string (which includes the salt internally).
 */
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS)
  return bcrypt.hashSync(password, salt)
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  return bcrypt.compareSync(password, storedHash)
}

// ─── Session Key Derivation ───────────────────────────────────

/**
 * Derive a 256-bit AES key from the user's password using PBKDF2.
 * The salt is stored alongside the password hash in the database.
 */
export function deriveSessionKey(password: string, salt: string): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
}

/**
 * Generate a random salt for PBKDF2 key derivation.
 * This is separate from bcrypt's internal salt.
 */
export function generateSalt(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Set the in-memory session key after successful authentication.
 */
export function setSessionKey(key: Buffer): void {
  sessionKey = key
  console.log('[Auth] Session key set (in-memory only)')
}

/**
 * Clear the session key (on lock, quit, or password change).
 */
export function clearSessionKey(): void {
  if (sessionKey) {
    sessionKey.fill(0) // Zero out before release
    sessionKey = null
    console.log('[Auth] Session key cleared')
  }
}

/**
 * Check whether a valid session is active (user is authenticated).
 */
export function hasActiveSession(): boolean {
  return sessionKey !== null
}

// ─── Content Encryption (AES-256-GCM) ─────────────────────────

/**
 * Encrypt plaintext content using AES-256-GCM.
 * Returns { encrypted, iv } where iv is needed for decryption.
 */
export function encryptContent(plaintext: string): { encrypted: string; iv: string } {
  if (!sessionKey) throw new Error('No active session — cannot encrypt')

  const iv = randomBytes(12) // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', sessionKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()
  // Append auth tag to encrypted data
  const combined = encrypted + '.' + authTag.toString('base64')

  return {
    encrypted: combined,
    iv: iv.toString('base64'),
  }
}

/**
 * Decrypt content encrypted with encryptContent().
 */
export function decryptContent(encryptedData: string, ivBase64: string): string {
  if (!sessionKey) throw new Error('No active session — cannot decrypt')

  const iv = Buffer.from(ivBase64, 'base64')
  const [encryptedText, authTagBase64] = encryptedData.split('.')

  if (!encryptedText || !authTagBase64) {
    throw new Error('Invalid encrypted data format')
  }

  const authTag = Buffer.from(authTagBase64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', sessionKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Re-encrypt content with a new session key.
 * Used during password change to re-encrypt all existing data.
 */
export function reEncryptContent(
  encryptedData: string,
  ivBase64: string,
  oldKey: Buffer,
  newKey: Buffer
): { encrypted: string; iv: string } {
  // Decrypt with old key
  const iv = Buffer.from(ivBase64, 'base64')
  const [encryptedText, authTagBase64] = encryptedData.split('.')
  if (!encryptedText || !authTagBase64) {
    throw new Error('Invalid encrypted data format')
  }
  const authTag = Buffer.from(authTagBase64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', oldKey, iv)
  decipher.setAuthTag(authTag)
  let plaintext = decipher.update(encryptedText, 'base64', 'utf8')
  plaintext += decipher.final('utf8')

  // Re-encrypt with new key
  const newIv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', newKey, newIv)
  let newEncrypted = cipher.update(plaintext, 'utf8', 'base64')
  newEncrypted += cipher.final('base64')
  const newAuthTag = cipher.getAuthTag()
  const combined = newEncrypted + '.' + newAuthTag.toString('base64')

  return {
    encrypted: combined,
    iv: newIv.toString('base64'),
  }
}
