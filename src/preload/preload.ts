import { contextBridge, ipcRenderer } from 'electron'

/**
 * Secure preload bridge for the Antigravity Diary.
 *
 * This exposes a typed API to the renderer via contextBridge.
 * The renderer has NO direct access to Node.js or Electron APIs.
 * All operations go through explicit IPC channels.
 */

const diaryAPI = {
  // ─── Authentication ─────────────────────────────────────────
  auth: {
    checkFirstRun: (): Promise<boolean> =>
      ipcRenderer.invoke('auth:check-first-run'),

    createPassword: (password: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('auth:create-password', password),

    login: (password: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('auth:login', password),

    changePassword: (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('auth:change-password', currentPassword, newPassword),

    checkSession: (): Promise<boolean> =>
      ipcRenderer.invoke('auth:check-session'),
  },

  // ─── Diary Entries ──────────────────────────────────────────
  entries: {
    list: (): Promise<unknown[]> =>
      ipcRenderer.invoke('entries:list'),

    create: (title: string, date: string): Promise<unknown> =>
      ipcRenderer.invoke('entries:create', title, date),

    update: (id: string, data: unknown): Promise<unknown> =>
      ipcRenderer.invoke('entries:update', id, data),

    delete: (id: string): Promise<unknown> =>
      ipcRenderer.invoke('entries:delete', id),
  },

  // ─── Pages ──────────────────────────────────────────────────
  pages: {
    get: (pageId: string): Promise<unknown> =>
      ipcRenderer.invoke('pages:get', pageId),

    getByEntry: (entryId: string): Promise<unknown[]> =>
      ipcRenderer.invoke('pages:get-by-entry', entryId),

    save: (pageId: string, content: string): Promise<unknown> =>
      ipcRenderer.invoke('pages:save', pageId, content),
  },

  // ─── Media ──────────────────────────────────────────────────
  media: {
    importImage: (pageId: string, entryId: string): Promise<unknown> =>
      ipcRenderer.invoke('media:import-image', pageId, entryId),

    importVideo: (pageId: string, entryId: string): Promise<unknown> =>
      ipcRenderer.invoke('media:import-video', pageId, entryId),

    getPath: (mediaId: string): Promise<string | null> =>
      ipcRenderer.invoke('media:get-path', mediaId),

    listByPage: (pageId: string): Promise<unknown[]> =>
      ipcRenderer.invoke('media:list-by-page', pageId),

    updatePosition: (mediaId: string, data: unknown): Promise<unknown> =>
      ipcRenderer.invoke('media:update-position', mediaId, data),

    delete: (mediaId: string): Promise<unknown> =>
      ipcRenderer.invoke('media:delete', mediaId),
  },

  // ─── Search ─────────────────────────────────────────────────
  search: {
    query: (searchText: string): Promise<unknown[]> =>
      ipcRenderer.invoke('search:query', searchText),
  },

  // ─── Settings ───────────────────────────────────────────────
  settings: {
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke('settings:get', key),

    set: (key: string, value: string): Promise<boolean> =>
      ipcRenderer.invoke('settings:set', key, value),

    getAll: (): Promise<Record<string, string>> =>
      ipcRenderer.invoke('settings:get-all'),
  },

  // ─── Backup ─────────────────────────────────────────────────
  backup: {
    export: (): Promise<unknown> =>
      ipcRenderer.invoke('backup:export'),

    import: (): Promise<unknown> =>
      ipcRenderer.invoke('backup:import'),
  },
  system: {
    openExternal: (url: string): Promise<unknown> =>
      ipcRenderer.invoke('system:open-external', url),
  }
}

// Expose the API to the renderer's window object
contextBridge.exposeInMainWorld('diaryAPI', diaryAPI)
