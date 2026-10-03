export const APP_NAME = 'Velyra'
export const APP_VERSION = '1.0.0'

export const DEFAULT_SETTINGS = {
  AUTOSAVE_DELAY_MS: 1000,
  PAGE_TURN_ENABLED: true,
  PAGE_TURN_SPEED_MS: 700,
  THEME: 'classic',
} as const

export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']
export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.webm', '.ogg', '.mov']

export const MIN_PASSWORD_LENGTH = 6

export const IPC_CHANNELS = {
  AUTH_CHECK_FIRST_RUN: 'auth:check-first-run',
  AUTH_CREATE_PASSWORD: 'auth:create-password',
  AUTH_LOGIN: 'auth:login',
  AUTH_CHANGE_PASSWORD: 'auth:change-password',
  ENTRIES_LIST: 'entries:list',
  ENTRIES_CREATE: 'entries:create',
  ENTRIES_UPDATE: 'entries:update',
  ENTRIES_DELETE: 'entries:delete',
  PAGES_GET: 'pages:get',
  PAGES_GET_BY_ENTRY: 'pages:get-by-entry',
  PAGES_SAVE: 'pages:save',
  MEDIA_IMPORT_IMAGE: 'media:import-image',
  MEDIA_IMPORT_VIDEO: 'media:import-video',
  MEDIA_GET_PATH: 'media:get-path',
  MEDIA_UPDATE_POSITION: 'media:update-position',
  MEDIA_DELETE: 'media:delete',
  SEARCH_QUERY: 'search:query',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',
  BACKUP_EXPORT: 'backup:export',
  BACKUP_IMPORT: 'backup:import',
} as const
