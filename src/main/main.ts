import { app, BrowserWindow, protocol, net } from 'electron'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import { initDatabase, closeDatabase, queryOne, getDatabase } from './database/database'
import { registerIpcHandlers } from './ipc'
import { ensureAppDirectories } from './storage/paths'

// Register custom protocol for serving local media files
// This is needed because webSecurity blocks file:// from http:// origins
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'diary-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0D0907',
    show: false,
    frame: true,
    title: 'Velyra',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false, // Required for preload to access Node.js APIs
    },
  })

  // Show window when renderer is ready — avoids white flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Load renderer from dev server or production bundle
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Application lifecycle ─────────────────────────────────────

app.whenReady().then(async () => {
  console.log('[Main] Application starting...')

  // Create app data directories
  ensureAppDirectories()
  console.log('[Main] App directories verified')

  // Initialize database (async for sql.js WASM loading)
  await initDatabase()
  console.log('[Main] Database ready')

  // Register IPC handlers
  registerIpcHandlers()

  // Register protocol handler for serving local media files
  protocol.handle('diary-media', (request) => {
    try {
      // 1. Extract the media ID from the URL (e.g. diary-media://asset/<uuid>)
      const urlMatch = request.url.match(/^diary-media:\/\/asset\/(.+)$/i)
      if (!urlMatch) {
        console.warn(`[Security] Invalid protocol URL format: ${request.url}`)
        return new Response('Bad Request', { status: 400 })
      }
      
      const mediaId = urlMatch[1]
      
      // 2. Look up the physical file path in the database
      const db = getDatabase()
      const stmt = db.prepare('SELECT file_path FROM media WHERE id = ?')
      stmt.bind([mediaId])
      
      let filePath = null
      if (stmt.step()) {
        const row = stmt.getAsObject()
        filePath = row.file_path as string
      }
      stmt.free()
      
      if (!filePath) {
        console.warn(`[Media] No database record found for media ID: ${mediaId}`)
        return new Response('File not found', { status: 404 })
      }
      
      // 3. Resolve path and perform security checks
      const allowedDir = resolve(app.getPath('userData'), 'diary-data')
      const resolvedPath = resolve(filePath)
      const fsExists = existsSync(resolvedPath)
      const isFile = fsExists ? require('fs').statSync(resolvedPath).isFile() : false
      const passesSecurity = resolvedPath.startsWith(allowedDir)
      
      if (!passesSecurity) {
        console.warn(`[Security] Blocked unauthorized media access: ${resolvedPath}`)
        return new Response('Forbidden', { status: 403 })
      }

      if (!fsExists || !isFile) {
        return new Response('File not found', { status: 404 })
      }
      
      // 4. Fetch the file safely
      const fetchUrl = `file:///${resolvedPath.replace(/\\/g, '/')}`
      return net.fetch(fetchUrl)
    } catch (err) {
      console.error('[Media] Protocol handle error:', err)
      return new Response('Bad Request', { status: 400 })
    }
  })
  console.log('[Main] Media protocol registered')

  // Create the main window
  createWindow()
  console.log('[Main] Window created')
})

app.on('window-all-closed', () => {
  closeDatabase()
  app.quit()
})

app.on('before-quit', () => {
  closeDatabase()
})
