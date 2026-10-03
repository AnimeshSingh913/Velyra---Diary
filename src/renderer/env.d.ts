/// <reference types="vite/client" />

import type { DiaryEntry, DiaryPage, MediaItem, SearchResult } from '../shared/types'

interface DiaryAPI {
  auth: {
    checkFirstRun: () => Promise<boolean>
    createPassword: (password: string) => Promise<{ success: boolean; error?: string }>
    login: (password: string) => Promise<{ success: boolean; error?: string }>
    changePassword: (
      currentPassword: string,
      newPassword: string
    ) => Promise<{ success: boolean; error?: string }>
    checkSession: () => Promise<boolean>
  }
  entries: {
    list: () => Promise<DiaryEntry[]>
    create: (title: string, date: string) => Promise<{ success: boolean; entry?: DiaryEntry; error?: string }>
    update: (id: string, data: { title?: string; date?: string }) => Promise<{ success: boolean; error?: string }>
    delete: (id: string) => Promise<{ success: boolean; error?: string }>
  }
  pages: {
    get: (pageId: string) => Promise<DiaryPage | null>
    getByEntry: (entryId: string) => Promise<DiaryPage[]>
    save: (pageId: string, content: string) => Promise<{ success: boolean; error?: string }>
  }
  media: {
    importImage: (pageId: string, entryId: string) => Promise<{ success: boolean; canceled?: boolean; media?: MediaItem; error?: string }>
    importVideo: (pageId: string, entryId: string) => Promise<{ success: boolean; canceled?: boolean; media?: MediaItem; error?: string }>
    getPath: (mediaId: string) => Promise<string | null>
    listByPage: (pageId: string) => Promise<MediaItem[]>
    updatePosition: (mediaId: string, data: { width?: number; height?: number; xPosition?: number; yPosition?: number; rotation?: number }) => Promise<{ success: boolean; error?: string }>
    delete: (mediaId: string) => Promise<{ success: boolean; error?: string }>
  }
  search: {
    query: (searchText: string) => Promise<SearchResult[]>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<boolean>
    getAll: () => Promise<Record<string, string>>
  }
  backup: {
    export: () => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
    import: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    diaryAPI: DiaryAPI
  }
}

export {}

