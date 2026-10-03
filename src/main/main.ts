import { app, BrowserWindow, protocol, net } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { initDatabase, closeDatabase } from './database/database'
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
    // diary-media://media/path/to/file -> file path
    const url = new URL(request.url)
    // The pathname contains the file path (URL-encoded)
    let filePath = decodeURIComponent(url.pathname)
    // On Windows, remove leading slash from /C:/path/to/file
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1)
    }
    // Security: only serve files that exist
    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 })
    }
    return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
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
