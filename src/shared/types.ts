// ============================================================
// Shared type definitions for the Antigravity Diary application
// Used by both main process and renderer
// ============================================================

export interface DiaryEntry {
  id: string
  title: string
  date: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface DiaryPage {
  id: string
  entryId: string
  orderIndex: number
  content: string // Tiptap JSON (decrypted)
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  pageId: string
  entryId: string
  mediaType: 'image' | 'video'
  filePath: string
  originalName: string
  mimeType: string
  width: number
  height: number
  xPosition: number
  yPosition: number
  rotation: number
  fileSize: number
  createdAt: string
}

export interface AppSettings {
  autosave_delay_ms: string
  page_turn_enabled: string
  page_turn_speed_ms: string
  theme: string
  last_spread_index: string
  [key: string]: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export interface SearchResult {
  entryId: string
  title: string
  date: string
  preview: string
  pageId: string
}

// Diary states for the 3D scene
export type DiaryState = 'closed' | 'opening' | 'open' | 'closing'
export type PageMode = 'normal' | 'focus' | 'edit'

// Page spread — two pages visible at once
export interface PageSpread {
  leftPageIndex: number
  rightPageIndex: number
}
