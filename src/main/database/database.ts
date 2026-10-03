import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { getDbPath, getAppDataPath } from '../storage/paths'
import { SCHEMA } from './schema'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

/**
 * Initialize the SQLite database using sql.js (pure JS/WASM).
 * Loads existing database from disk if present, otherwise creates a new one.
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  dbPath = getDbPath()

  // sql.js needs the WASM binary — resolve it from node_modules
  const wasmPath = join(getAppDataPath(), '..', '..', '..') // won't use this
  const SQL = await initSqlJs()

  // Load existing database or create new
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
    console.log('[Database] Loaded existing database from:', dbPath)
  } else {
    db = new SQL.Database()
    console.log('[Database] Created new database')
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;')

  // Create tables if they don't exist
  db.run(SCHEMA)

  // Insert default settings if not present
  const defaults: Record<string, string> = {
    autosave_delay_ms: '1000',
    page_turn_enabled: 'true',
    page_turn_speed_ms: '700',
    theme: 'classic',
    last_spread_index: '0',
  }

  for (const [key, value] of Object.entries(defaults)) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value])
  }

  // Persist to disk
  saveDatabase()

  console.log('[Database] Initialized at:', dbPath)
  return db
}

/**
 * Save the in-memory database to disk.
 * sql.js operates in-memory, so we must explicitly persist changes.
 */
export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(dbPath, buffer)
}

/**
 * Get the active database instance.
 * Throws if initDatabase() hasn't been called.
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

/**
 * Close and persist the database.
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
    console.log('[Database] Closed and saved')
  }
}
