import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

export function getAppDataPath(): string {
  return join(app.getPath('userData'), 'diary-data')
}

export function getDbPath(): string {
  return join(getAppDataPath(), 'database', 'diary.db')
}

export function getMediaPath(type?: 'images' | 'videos'): string {
  const base = join(getAppDataPath(), 'media')
  return type ? join(base, type) : base
}

export function getBackupPath(): string {
  return join(getAppDataPath(), 'backups')
}

export function ensureAppDirectories(): void {
  const dirs = [
    join(getAppDataPath(), 'database'),
    getMediaPath('images'),
    getMediaPath('videos'),
    getBackupPath(),
  ]
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}
