import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { copyFileSync, statSync, existsSync, unlinkSync } from 'fs'
import { join, extname, basename } from 'path'
import { getDatabase, saveDatabase, closeDatabase, initDatabase } from '../database/database'
import { getMediaPath, getDbPath } from '../storage/paths'
import {
  hashPassword,
  verifyPassword,
  generateSalt,
  deriveSessionKey,
  setSessionKey,
  clearSessionKey,
  hasActiveSession,
  reEncryptContent,
  encryptContent,
  decryptContent,
} from '../auth/auth'

/**
 * Helper to query a single row from sql.js.
 * sql.js returns arrays of objects via exec(), this makes it convenient.
 */
function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | null {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const columns = stmt.getColumnNames()
    const values = stmt.get()
    stmt.free()
    const row: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      row[col] = values[i]
    })
    return row
  }
  stmt.free()
  return null
}

function queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const db = getDatabase()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: Record<string, unknown>[] = []
  while (stmt.step()) {
    const columns = stmt.getColumnNames()
    const values = stmt.get()
    const row: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      row[col] = values[i]
    })
    rows.push(row)
  }
  stmt.free()
  return rows
}

function runSql(sql: string, params: unknown[] = []): void {
  const db = getDatabase()
  db.run(sql, params)
  saveDatabase()
}

/**
 * Map snake_case DB row to camelCase for the renderer.
 */
function mapEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPage(row: Record<string, unknown>, decryptedContent?: string) {
  return {
    id: row.id,
    entryId: row.entry_id,
    orderIndex: row.order_index,
    content: decryptedContent ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMedia(row: Record<string, unknown>) {
  return {
    id: row.id,
    pageId: row.page_id,
    entryId: row.entry_id,
    mediaType: row.media_type,
    filePath: row.file_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    xPosition: row.x_position,
    yPosition: row.y_position,
    rotation: row.rotation,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }
}

export function registerIpcHandlers(): void {
  // ─── Authentication ───────────────────────────────────────────

  /**
   * Check if this is the first run (no password has been created yet).
   */
  ipcMain.handle('auth:check-first-run', async () => {
    const row = queryOne('SELECT id FROM diary WHERE id = 1')
    return !row // true = first run (no password set yet)
  })

  /**
   * Create the master password (first-time setup).
   * - Hashes password with bcrypt
   * - Generates a PBKDF2 salt for key derivation
   * - Derives an AES-256 session key from the password
   * - Stores hash and salt in the database
   */
  ipcMain.handle('auth:create-password', async (_event, password: string) => {
    try {
      if (!password || password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters.' }
      }

      // Check that no password already exists
      const existing = queryOne('SELECT id FROM diary WHERE id = 1')
      if (existing) {
        return { success: false, error: 'A password already exists. Use change-password instead.' }
      }

      // Hash password (bcrypt internally manages its own salt)
      const hash = hashPassword(password)

      // Generate separate salt for PBKDF2 key derivation
      const keySalt = generateSalt()

      // Store in database
      runSql(
        'INSERT INTO diary (id, password_hash, salt) VALUES (1, ?, ?)',
        [hash, keySalt]
      )

      // Derive session key and store in memory
      const key = deriveSessionKey(password, keySalt)
      setSessionKey(key)

      console.log('[Auth] Password created successfully')
      return { success: true }
    } catch (err) {
      console.error('[Auth] Error creating password:', err)
      return { success: false, error: 'Failed to create password.' }
    }
  })

  /**
   * Login with the master password.
   * - Verifies password against stored bcrypt hash
   * - Derives session key on success
   */
  ipcMain.handle('auth:login', async (_event, password: string) => {
    try {
      const row = queryOne('SELECT password_hash, salt FROM diary WHERE id = 1')
      if (!row) {
        return { success: false, error: 'No password set. Please create one first.' }
      }

      const storedHash = row.password_hash as string
      const keySalt = row.salt as string

      if (!verifyPassword(password, storedHash)) {
        return { success: false, error: 'Incorrect password.' }
      }

      // Derive session key and store in memory
      const key = deriveSessionKey(password, keySalt)
      setSessionKey(key)

      console.log('[Auth] Login successful')
      return { success: true }
    } catch (err) {
      console.error('[Auth] Error during login:', err)
      return { success: false, error: 'Login failed.' }
    }
  })

  /**
   * Change the master password.
   * - Verifies current password
   * - Re-hashes with new password
   * - Re-derives session key
   * - Re-encrypts all existing page content with new key
   */
  ipcMain.handle('auth:change-password', async (_event, currentPassword: string, newPassword: string) => {
    try {
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'New password must be at least 4 characters.' }
      }

      const row = queryOne('SELECT password_hash, salt FROM diary WHERE id = 1')
      if (!row) {
        return { success: false, error: 'No password set.' }
      }

      const storedHash = row.password_hash as string
      const oldSalt = row.salt as string

      if (!verifyPassword(currentPassword, storedHash)) {
        return { success: false, error: 'Current password is incorrect.' }
      }

      // Derive old key for re-encryption
      const oldKey = deriveSessionKey(currentPassword, oldSalt)

      // Create new hash and salt
      const newHash = hashPassword(newPassword)
      const newSalt = generateSalt()
      const newKey = deriveSessionKey(newPassword, newSalt)

      // Re-encrypt all existing page content
      const pages = queryAll('SELECT id, content, iv FROM pages WHERE iv IS NOT NULL AND content != \'\'')
      for (const page of pages) {
        const pageContent = page.content as string
        const pageIv = page.iv as string
        if (pageContent && pageIv) {
          try {
            const reEncrypted = reEncryptContent(pageContent, pageIv, oldKey, newKey)
            runSql('UPDATE pages SET content = ?, iv = ? WHERE id = ?', [
              reEncrypted.encrypted,
              reEncrypted.iv,
              page.id,
            ])
          } catch (reErr) {
            console.error(`[Auth] Failed to re-encrypt page ${page.id}:`, reErr)
            return { success: false, error: 'Failed to re-encrypt existing data.' }
          }
        }
      }

      // Update password hash and salt in database
      runSql('UPDATE diary SET password_hash = ?, salt = ?, updated_at = datetime(\'now\') WHERE id = 1', [
        newHash,
        newSalt,
      ])

      // Set new session key
      clearSessionKey()
      setSessionKey(newKey)

      // Zero out old key
      oldKey.fill(0)

      console.log('[Auth] Password changed successfully')
      return { success: true }
    } catch (err) {
      console.error('[Auth] Error changing password:', err)
      return { success: false, error: 'Failed to change password.' }
    }
  })

  /**
   * Check if user is currently authenticated.
   */
  ipcMain.handle('auth:check-session', async () => {
    return hasActiveSession()
  })

  // ─── Entries ──────────────────────────────────────────────────

  /**
   * List all diary entries, ordered by order_index.
   */
  ipcMain.handle('entries:list', async () => {
    try {
      const rows = queryAll('SELECT * FROM entries ORDER BY order_index ASC')
      return rows.map(mapEntry)
    } catch (err) {
      console.error('[Entries] Error listing entries:', err)
      return []
    }
  })

  /**
   * Create a new diary entry with a title and date.
   * Also creates a first blank page for the entry.
   */
  ipcMain.handle('entries:create', async (_event, title: string, date: string) => {
    try {
      if (!title || !title.trim()) {
        return { success: false, error: 'Title is required.' }
      }

      const entryId = uuidv4()
      const pageId = uuidv4()

      // Get next order index
      const maxRow = queryOne('SELECT MAX(order_index) as max_idx FROM entries')
      const nextIndex = maxRow?.max_idx !== null && maxRow?.max_idx !== undefined
        ? (maxRow.max_idx as number) + 1
        : 0

      // Create the entry
      runSql(
        'INSERT INTO entries (id, title, date, order_index) VALUES (?, ?, ?, ?)',
        [entryId, title.trim(), date, nextIndex]
      )

      // Create a first blank page for this entry
      runSql(
        'INSERT INTO pages (id, entry_id, order_index, content) VALUES (?, ?, 0, \'\')',
        [pageId, entryId]
      )

      // Fetch the created entry to return it
      const entryRow = queryOne('SELECT * FROM entries WHERE id = ?', [entryId])
      if (!entryRow) {
        return { success: false, error: 'Failed to retrieve created entry.' }
      }

      console.log(`[Entries] Created entry: "${title}" (${entryId})`)
      return { success: true, entry: mapEntry(entryRow) }
    } catch (err) {
      console.error('[Entries] Error creating entry:', err)
      return { success: false, error: 'Failed to create entry.' }
    }
  })

  /**
   * Update an entry's title or date.
   */
  ipcMain.handle('entries:update', async (_event, id: string, data: unknown) => {
    try {
      const entry = queryOne('SELECT id FROM entries WHERE id = ?', [id])
      if (!entry) {
        return { success: false, error: 'Entry not found.' }
      }

      const updateData = data as { title?: string; date?: string }
      const updates: string[] = []
      const params: unknown[] = []

      if (updateData.title !== undefined) {
        updates.push('title = ?')
        params.push(updateData.title.trim())
      }
      if (updateData.date !== undefined) {
        updates.push('date = ?')
        params.push(updateData.date)
      }

      if (updates.length === 0) {
        return { success: true }
      }

      updates.push("updated_at = datetime('now')")
      params.push(id)

      runSql(`UPDATE entries SET ${updates.join(', ')} WHERE id = ?`, params)

      console.log(`[Entries] Updated entry ${id}`)
      return { success: true }
    } catch (err) {
      console.error('[Entries] Error updating entry:', err)
      return { success: false, error: 'Failed to update entry.' }
    }
  })

  /**
   * Delete an entry and all its pages and media.
   */
  ipcMain.handle('entries:delete', async (_event, id: string) => {
    try {
      const entry = queryOne('SELECT id FROM entries WHERE id = ?', [id])
      if (!entry) {
        return { success: false, error: 'Entry not found.' }
      }

      // Delete media, pages, and entry (foreign keys cascade)
      runSql('DELETE FROM media WHERE entry_id = ?', [id])
      runSql('DELETE FROM pages WHERE entry_id = ?', [id])
      runSql('DELETE FROM entries WHERE id = ?', [id])

      console.log(`[Entries] Deleted entry ${id}`)
      return { success: true }
    } catch (err) {
      console.error('[Entries] Error deleting entry:', err)
      return { success: false, error: 'Failed to delete entry.' }
    }
  })

  // ─── Pages ────────────────────────────────────────────────────

  /**
   * Get a single page by ID, with decrypted content.
   */
  ipcMain.handle('pages:get', async (_event, pageId: string) => {
    try {
      const row = queryOne('SELECT * FROM pages WHERE id = ?', [pageId])
      if (!row) return null

      let decryptedContent = ''
      const rawContent = row.content as string
      const iv = row.iv as string | null

      if (rawContent && iv && hasActiveSession()) {
        try {
          decryptedContent = decryptContent(rawContent, iv)
        } catch (decErr) {
          console.error(`[Pages] Failed to decrypt page ${pageId}:`, decErr)
          decryptedContent = ''
        }
      } else if (rawContent && !iv) {
        // Unencrypted content (e.g., freshly created page)
        decryptedContent = rawContent
      }

      return mapPage(row, decryptedContent)
    } catch (err) {
      console.error('[Pages] Error getting page:', err)
      return null
    }
  })

  /**
   * Get all pages for an entry, with decrypted content, ordered by order_index.
   */
  ipcMain.handle('pages:get-by-entry', async (_event, entryId: string) => {
    try {
      const rows = queryAll(
        'SELECT * FROM pages WHERE entry_id = ? ORDER BY order_index ASC',
        [entryId]
      )

      return rows.map((row) => {
        let decryptedContent = ''
        const rawContent = row.content as string
        const iv = row.iv as string | null

        if (rawContent && iv && hasActiveSession()) {
          try {
            decryptedContent = decryptContent(rawContent, iv)
          } catch {
            decryptedContent = ''
          }
        } else if (rawContent && !iv) {
          decryptedContent = rawContent
        }

        return mapPage(row, decryptedContent)
      })
    } catch (err) {
      console.error('[Pages] Error getting pages by entry:', err)
      return []
    }
  })

  /**
   * Save page content (encrypts before storing).
   */
  ipcMain.handle('pages:save', async (_event, pageId: string, content: string) => {
    try {
      const page = queryOne('SELECT id FROM pages WHERE id = ?', [pageId])
      if (!page) {
        return { success: false, error: 'Page not found.' }
      }

      if (hasActiveSession() && content) {
        // Encrypt the content
        const { encrypted, iv } = encryptContent(content)
        runSql(
          "UPDATE pages SET content = ?, iv = ?, updated_at = datetime('now') WHERE id = ?",
          [encrypted, iv, pageId]
        )
      } else {
        // Store unencrypted (empty content or no session)
        runSql(
          "UPDATE pages SET content = ?, iv = NULL, updated_at = datetime('now') WHERE id = ?",
          [content, pageId]
        )
      }

      return { success: true }
    } catch (err) {
      console.error('[Pages] Error saving page:', err)
      return { success: false, error: 'Failed to save page.' }
    }
  })

  // ─── Media ────────────────────────────────────────────────────

  /**
   * Import an image via the native file picker.
   * Copies the file into AppData/media/images/ with a unique name.
   * Requires pageId and entryId as arguments.
   */
  ipcMain.handle(
    'media:import-image',
    async (_event, pageId: string, entryId: string) => {
      try {
        const win = BrowserWindow.getFocusedWindow()
        const result = await dialog.showOpenDialog(win!, {
          title: 'Select Image',
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
          ],
        })

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true }
        }

        const sourcePath = result.filePaths[0]
        const originalName = basename(sourcePath)
        const ext = extname(sourcePath).toLowerCase()
        const mediaId = uuidv4()
        const destFileName = `${mediaId}${ext}`
        const destPath = join(getMediaPath('images'), destFileName)

        // Copy file to media directory
        copyFileSync(sourcePath, destPath)

        // Get file info
        const stat = statSync(destPath)

        // Determine MIME type
        const mimeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
        }
        const mimeType = mimeMap[ext] || 'image/jpeg'

        // Insert into database with default dimensions (will be updated by renderer)
        runSql(
          `INSERT INTO media (id, page_id, entry_id, media_type, file_path, original_name, mime_type, width, height, x_position, y_position, rotation, file_size)
           VALUES (?, ?, ?, 'image', ?, ?, ?, 100, 100, 0, 0, 0, ?)`,
          [mediaId, pageId, entryId, destPath, originalName, mimeType, stat.size]
        )

        console.log(`[Media] Imported image: "${originalName}" (${mediaId})`)
        return {
          success: true,
          media: mapMedia(queryOne('SELECT * FROM media WHERE id = ?', [mediaId])!),
        }
      } catch (err) {
        console.error('[Media] Error importing image:', err)
        return { success: false, error: 'Failed to import image.' }
      }
    }
  )

  /**
   * Import a video via the native file picker.
   * Stores a reference to the original file path (not copied for large files).
   */
  ipcMain.handle(
    'media:import-video',
    async (_event, pageId: string, entryId: string) => {
      try {
        const win = BrowserWindow.getFocusedWindow()
        const result = await dialog.showOpenDialog(win!, {
          title: 'Select Video',
          properties: ['openFile'],
          filters: [
            { name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'] },
          ],
        })

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true }
        }

        const sourcePath = result.filePaths[0]
        const originalName = basename(sourcePath)
        const ext = extname(sourcePath).toLowerCase()
        const mediaId = uuidv4()
        const destFileName = `${mediaId}${ext}`
        const destPath = join(getMediaPath('videos'), destFileName)
        const stat = statSync(sourcePath)

        // For small videos (<100MB), copy to app data directory
        // For large videos, store reference to original path
        const sizeLimit = 100 * 1024 * 1024 // 100 MB
        let storedPath: string

        if (stat.size <= sizeLimit) {
          copyFileSync(sourcePath, destPath)
          storedPath = destPath
        } else {
          // Store reference to original file
          storedPath = sourcePath
        }

        const mimeMap: Record<string, string> = {
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.ogg': 'video/ogg',
          '.mov': 'video/quicktime',
          '.avi': 'video/x-msvideo',
          '.mkv': 'video/x-matroska',
        }
        const mimeType = mimeMap[ext] || 'video/mp4'

        runSql(
          `INSERT INTO media (id, page_id, entry_id, media_type, file_path, original_name, mime_type, width, height, x_position, y_position, rotation, file_size)
           VALUES (?, ?, ?, 'video', ?, ?, ?, 100, 56, 0, 0, 0, ?)`,
          [mediaId, pageId, entryId, storedPath, originalName, mimeType, stat.size]
        )

        console.log(`[Media] Imported video: "${originalName}" (${mediaId})`)
        return {
          success: true,
          media: mapMedia(queryOne('SELECT * FROM media WHERE id = ?', [mediaId])!),
        }
      } catch (err) {
        console.error('[Media] Error importing video:', err)
        return { success: false, error: 'Failed to import video.' }
      }
    }
  )

  /**
   * Get the file:// URL for a media item (for rendering in the page).
   */
  ipcMain.handle('media:get-path', async (_event, mediaId: string) => {
    try {
      const row = queryOne('SELECT file_path FROM media WHERE id = ?', [mediaId])
      if (!row) return null
      
      return `diary-media://asset/${mediaId}`
    } catch (err) {
      console.error('[Media] Error getting path:', err)
      return null
    }
  })

  /**
   * List all media items for a given page.
   */
  ipcMain.handle('media:list-by-page', async (_event, pageId: string) => {
    try {
      const rows = queryAll('SELECT * FROM media WHERE page_id = ?', [pageId])
      return rows.map(mapMedia)
    } catch (err) {
      console.error('[Media] Error listing media:', err)
      return []
    }
  })

  /**
   * Update the position/size of a media item.
   */
  ipcMain.handle(
    'media:update-position',
    async (
      _event,
      mediaId: string,
      data: { width?: number; height?: number; xPosition?: number; yPosition?: number; rotation?: number }
    ) => {
      try {
        const updates: string[] = []
        const params: unknown[] = []

        if (data.width !== undefined) { updates.push('width = ?'); params.push(data.width) }
        if (data.height !== undefined) { updates.push('height = ?'); params.push(data.height) }
        if (data.xPosition !== undefined) { updates.push('x_position = ?'); params.push(data.xPosition) }
        if (data.yPosition !== undefined) { updates.push('y_position = ?'); params.push(data.yPosition) }
        if (data.rotation !== undefined) { updates.push('rotation = ?'); params.push(data.rotation) }

        if (updates.length === 0) return { success: true }

        params.push(mediaId)
        runSql(`UPDATE media SET ${updates.join(', ')} WHERE id = ?`, params)

        return { success: true }
      } catch (err) {
        console.error('[Media] Error updating position:', err)
        return { success: false, error: 'Failed to update media position.' }
      }
    }
  )

  /**
   * Delete a media item and its file from disk.
   */
  ipcMain.handle('media:delete', async (_event, mediaId: string) => {
    try {
      const row = queryOne('SELECT file_path, media_type FROM media WHERE id = ?', [mediaId])
      if (!row) return { success: false, error: 'Media not found.' }

      // Delete file from disk
      const filePath = row.file_path as string
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath)
        } catch {
          console.warn(`[Media] Could not delete file: ${filePath}`)
        }
      }

      // Delete from database
      runSql('DELETE FROM media WHERE id = ?', [mediaId])

      console.log(`[Media] Deleted media: ${mediaId}`)
      return { success: true }
    } catch (err) {
      console.error('[Media] Error deleting media:', err)
      return { success: false, error: 'Failed to delete media.' }
    }
  })

  // ─── Search ───────────────────────────────────────────────────
  ipcMain.handle('search:query', async (_event, searchText: string) => {
    try {
      if (!searchText || searchText.trim().length === 0) return []
      const query = `%${searchText.trim()}%`
      const results: Array<{
        entryId: string
        title: string
        date: string
        preview: string
        pageId: string
      }> = []

      // Search entry titles
      const titleMatches = queryAll(
        'SELECT id, title, date FROM entries WHERE title LIKE ? ORDER BY date DESC',
        [query]
      )
      for (const row of titleMatches) {
        // Get first page for this entry
        const page = queryOne('SELECT id FROM pages WHERE entry_id = ? ORDER BY order_index ASC LIMIT 1', [row.id])
        results.push({
          entryId: row.id as string,
          title: row.title as string,
          date: row.date as string,
          preview: `Title match: "${row.title}"`,
          pageId: (page?.id as string) || '',
        })
      }

      // Search page content (may be encrypted)
      if (hasActiveSession()) {
        const pages = queryAll('SELECT id, entry_id, content, iv FROM pages')
        for (const page of pages) {
          let content = page.content as string
          // Decrypt if encrypted
          if (page.iv && content) {
            try {
              content = decryptContent(content, page.iv as string)
            } catch {
              continue // Skip pages we can't decrypt
            }
          }
          // Strip HTML tags for plain-text search
          const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          if (plainText.toLowerCase().includes(searchText.trim().toLowerCase())) {
            // Get entry info
            const entry = queryOne('SELECT id, title, date FROM entries WHERE id = ?', [page.entry_id])
            if (!entry) continue
            // Check if we already have this entry from title match
            if (results.some(r => r.entryId === entry.id)) continue

            // Extract preview snippet around the match
            const lowerPlain = plainText.toLowerCase()
            const matchIdx = lowerPlain.indexOf(searchText.trim().toLowerCase())
            const start = Math.max(0, matchIdx - 40)
            const end = Math.min(plainText.length, matchIdx + searchText.length + 40)
            let preview = plainText.substring(start, end)
            if (start > 0) preview = '…' + preview
            if (end < plainText.length) preview = preview + '…'

            results.push({
              entryId: entry.id as string,
              title: entry.title as string,
              date: entry.date as string,
              preview,
              pageId: page.id as string,
            })
          }
        }
      }

      return results
    } catch (err) {
      console.error('[Search] Error:', err)
      return []
    }
  })

  // ─── Settings ─────────────────────────────────────────────────
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const row = queryOne('SELECT value FROM settings WHERE key = ?', [key])
    return (row?.value as string) ?? null
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    runSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
    return true
  })

  ipcMain.handle('settings:get-all', async () => {
    const rows = queryAll('SELECT key, value FROM settings')
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key as string] = row.value as string
    }
    return settings
  })

  // ─── Backup ───────────────────────────────────────────────────

  /**
   * Export a backup ZIP containing the database and all media files.
   */
  ipcMain.handle('backup:export', async () => {
    try {
      const { createWriteStream, readdirSync, readFileSync } = await import('fs')
      const archiver = await import('archiver')

      const win = BrowserWindow.getFocusedWindow()
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const result = await dialog.showSaveDialog(win!, {
        title: 'Export Diary Backup',
        defaultPath: `diary-backup-${dateStr}.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // Save database to ensure latest changes are on disk
      saveDatabase()

      const output = createWriteStream(result.filePath)
      const archive = archiver.default('zip', { zlib: { level: 9 } })

      return new Promise((resolve) => {
        output.on('close', () => {
          console.log(`[Backup] Exported: ${result.filePath} (${archive.pointer()} bytes)`)
          resolve({ success: true, path: result.filePath, size: archive.pointer() })
        })

        archive.on('error', (err: Error) => {
          console.error('[Backup] Archive error:', err)
          resolve({ success: false, error: 'Failed to create backup archive.' })
        })

        archive.pipe(output)

        // Add database file
        const dbPath = getDbPath()
        archive.file(dbPath, { name: 'database/diary.db' })

        // Add backup metadata
        const metadata = JSON.stringify({
          version: 1,
          appVersion: '1.0.0',
          createdAt: now.toISOString(),
          platform: process.platform,
        })
        archive.append(metadata, { name: 'backup-meta.json' })

        // Add images
        const imagesDir = getMediaPath('images')
        try {
          const images = readdirSync(imagesDir)
          for (const img of images) {
            archive.file(join(imagesDir, img), { name: `media/images/${img}` })
          }
        } catch { /* no images dir */ }

        // Add videos
        const videosDir = getMediaPath('videos')
        try {
          const videos = readdirSync(videosDir)
          for (const vid of videos) {
            archive.file(join(videosDir, vid), { name: `media/videos/${vid}` })
          }
        } catch { /* no videos dir */ }

        archive.finalize()
      })
    } catch (err) {
      console.error('[Backup] Export error:', err)
      return { success: false, error: 'Failed to export backup.' }
    }
  })

  /**
   * Import a backup ZIP, replacing the current diary data.
   */
  ipcMain.handle('backup:import', async () => {
    try {
      const { createReadStream, writeFileSync: writeFsSync, mkdirSync: mkdirFsSync, existsSync: existsFsSync } = await import('fs')
      const unzipper = await import('unzipper')

      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showOpenDialog(win!, {
        title: 'Import Diary Backup',
        properties: ['openFile'],
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      const zipPath = result.filePaths[0]

      // Validate the ZIP contains a backup
      const directory = await unzipper.Open.file(zipPath)
      const metaFile = directory.files.find(f => f.path === 'backup-meta.json')
      const dbFile = directory.files.find(f => f.path === 'database/diary.db')

      if (!dbFile) {
        return { success: false, error: 'Invalid backup: missing database file.' }
      }

      // Validate metadata if present
      if (metaFile) {
        const metaBuffer = await metaFile.buffer()
        const meta = JSON.parse(metaBuffer.toString('utf-8'))
        if (!meta.version) {
          return { success: false, error: 'Invalid backup: corrupted metadata.' }
        }
      }

      // Confirm with user
      const confirm = await dialog.showMessageBox(win!, {
        type: 'warning',
        title: 'Restore Backup',
        message: 'Restore from this backup?',
        detail: 'This will replace your current diary with the backup data. This action cannot be undone.',
        buttons: ['Cancel', 'Restore'],
        defaultId: 0,
        cancelId: 0,
      })

      if (confirm.response !== 1) {
        return { success: false, canceled: true }
      }

      // Close current database
      closeDatabase()

      // Restore database
      const dbBuffer = await dbFile.buffer()
      const dbPath = getDbPath()
      writeFsSync(dbPath, dbBuffer)

      // Restore media files
      const mediaFiles = directory.files.filter(f => f.path.startsWith('media/'))
      for (const file of mediaFiles) {
        const relativePath = file.path
        let destDir: string
        let destPath: string

        if (relativePath.startsWith('media/images/')) {
          destDir = getMediaPath('images')
          destPath = join(destDir, basename(relativePath))
        } else if (relativePath.startsWith('media/videos/')) {
          destDir = getMediaPath('videos')
          destPath = join(destDir, basename(relativePath))
        } else {
          continue
        }

        if (!existsFsSync(destDir)) {
          mkdirFsSync(destDir, { recursive: true })
        }

        const fileBuffer = await file.buffer()
        writeFsSync(destPath, fileBuffer)
      }

      // Re-initialize database
      await initDatabase()

      console.log(`[Backup] Imported from: ${zipPath}`)
      return { success: true }
    } catch (err) {
      console.error('[Backup] Import error:', err)
      return { success: false, error: 'Failed to import backup.' }
    }
  })

  // ─── System ───────────────────────────────────────────────────
  ipcMain.handle('system:open-external', async (_event, url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        await shell.openExternal(url)
        return { success: true }
      }
      return { success: false, error: 'Invalid protocol' }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  console.log('[IPC] All handlers registered')
}
