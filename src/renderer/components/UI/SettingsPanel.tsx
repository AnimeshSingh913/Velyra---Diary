import React, { useCallback, useEffect, useState } from 'react'
import { X, Lock, Save, BookOpen, Palette, Package, Upload, Download, Keyboard } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Settings panel overlay.
 * Sections: Password, Autosave, Animation, Theme, Backup/Restore, About.
 */
export function SettingsPanel({
  isOpen,
  onClose,
}: SettingsPanelProps): React.JSX.Element | null {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMessage, setPwMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isPwChanging, setIsPwChanging] = useState(false)

  const [autosaveDelay, setAutosaveDelay] = useState('1000')
  const [pageTurnEnabled, setPageTurnEnabled] = useState(true)
  const [pageTurnSpeed, setPageTurnSpeed] = useState('700')
  const [theme, setTheme] = useState('classic')

  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)

  // ── Load settings ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    async function load() {
      try {
        const all = await window.diaryAPI.settings.getAll()
        if (all.autosave_delay_ms) setAutosaveDelay(all.autosave_delay_ms)
        if (all.page_turn_enabled) setPageTurnEnabled(all.page_turn_enabled === 'true')
        if (all.page_turn_speed_ms) setPageTurnSpeed(all.page_turn_speed_ms)
        if (all.theme) setTheme(all.theme)
      } catch (err) {
        console.error('[Settings] Failed to load:', err)
      }
    }
    load()
  }, [isOpen])

  // ── Save individual setting ───────────────────────────────
  const saveSetting = useCallback(async (key: string, value: string) => {
    try {
      await window.diaryAPI.settings.set(key, value)
    } catch (err) {
      console.error('[Settings] Failed to save:', key, err)
    }
  }, [])

  // ── Password change ───────────────────────────────────────
  const handlePasswordChange = useCallback(async () => {
    setPwMessage(null)
    if (!currentPw) {
      setPwMessage({ text: 'Enter your current password.', type: 'error' })
      return
    }
    if (newPw.length < 4) {
      setPwMessage({ text: 'New password must be at least 4 characters.', type: 'error' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMessage({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    setIsPwChanging(true)
    try {
      const result = await window.diaryAPI.auth.changePassword(currentPw, newPw)
      if (result.success) {
        setPwMessage({ text: 'Password changed successfully.', type: 'success' })
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      } else {
        setPwMessage({ text: result.error || 'Failed to change password.', type: 'error' })
      }
    } catch (err) {
      setPwMessage({ text: 'An error occurred.', type: 'error' })
    } finally {
      setIsPwChanging(false)
    }
  }, [currentPw, newPw, confirmPw])

  // ── Backup ────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setBackupMessage(null)
    setIsBackingUp(true)
    try {
      const result = await window.diaryAPI.backup.export() as {
        success: boolean; canceled?: boolean; error?: string; path?: string
      }
      if (result.success) {
        setBackupMessage({ text: 'Backup exported successfully!', type: 'success' })
      } else if (!result.canceled) {
        setBackupMessage({ text: result.error || 'Export failed.', type: 'error' })
      }
    } catch (err) {
      setBackupMessage({ text: 'Export failed.', type: 'error' })
    } finally {
      setIsBackingUp(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    setBackupMessage(null)
    setIsBackingUp(true)
    try {
      const result = await window.diaryAPI.backup.import() as {
        success: boolean; canceled?: boolean; error?: string
      }
      if (result.success) {
        setBackupMessage({ text: 'Backup restored! The app will reload.', type: 'success' })
        // Reload after a short delay
        setTimeout(() => window.location.reload(), 1500)
      } else if (!result.canceled) {
        setBackupMessage({ text: result.error || 'Import failed.', type: 'error' })
      }
    } catch (err) {
      setBackupMessage({ text: 'Import failed.', type: 'error' })
    } finally {
      setIsBackingUp(false)
    }
  }, [])

  // ── Escape to close ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="settings-panel">
      <div className="settings-panel__backdrop" onClick={onClose} />
      <div className="settings-panel__container">
        <div className="settings-panel__header">
          <h2 className="settings-panel__title">Settings</h2>
          <button className="settings-panel__close" onClick={onClose} title="Close (Escape)">
            <X size={18} />
          </button>
        </div>

        <div className="settings-panel__body">
          {/* ── Appearance Section ─── */}
          <section className="settings-section">
            <h3 className="settings-section__title">
              <Palette size={16} /> Appearance
            </h3>
            <div className="settings-field settings-field--inline">
              <label className="settings-label">Diary theme</label>
              <select
                className="settings-select"
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value)
                  saveSetting('theme', e.target.value)
                }}
              >
                <option value="classic">Classic (Default)</option>
                <option value="vintage" disabled>Vintage (Coming soon)</option>
                <option value="minimal" disabled>Minimal (Coming soon)</option>
              </select>
            </div>
            <div className="settings-field settings-field--inline">
              <label className="settings-label">Page turn animation</label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={pageTurnEnabled}
                  onChange={(e) => {
                    setPageTurnEnabled(e.target.checked)
                    saveSetting('page_turn_enabled', String(e.target.checked))
                  }}
                />
                <span className="settings-toggle__slider" />
              </label>
            </div>
            <div className="settings-field settings-field--inline">
              <label className="settings-label">Turn speed</label>
              <select
                className="settings-select"
                value={pageTurnSpeed}
                onChange={(e) => {
                  setPageTurnSpeed(e.target.value)
                  saveSetting('page_turn_speed_ms', e.target.value)
                }}
                disabled={!pageTurnEnabled}
              >
                <option value="400">Fast (400ms)</option>
                <option value="700">Normal (700ms)</option>
                <option value="1000">Slow (1s)</option>
                <option value="1500">Very slow (1.5s)</option>
              </select>
            </div>
          </section>

          {/* ── Security Section ─── */}
          <section className="settings-section">
            <h3 className="settings-section__title">
              <Lock size={16} /> Security
            </h3>
            <p className="settings-description">
              Change your master password.
            </p>
            <div className="settings-field">
              <label className="settings-label">Current Password</label>
              <input
                type="password"
                className="settings-input"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <input
                type="password"
                className="settings-input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Confirm New Password</label>
              <input
                type="password"
                className="settings-input"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="off"
              />
            </div>
            {pwMessage && (
              <div className={`settings-message settings-message--${pwMessage.type}`}>
                {pwMessage.text}
              </div>
            )}
            <button
              className="settings-btn settings-btn--primary"
              onClick={handlePasswordChange}
              disabled={isPwChanging}
            >
              {isPwChanging ? 'Changing…' : 'Change Password'}
            </button>
          </section>

          {/* ── Data Section ─── */}
          <section className="settings-section">
            <h3 className="settings-section__title">
              <Package size={16} /> Data
            </h3>
            <div className="settings-field settings-field--inline" style={{ marginBottom: '1.5rem' }}>
              <label className="settings-label">Autosave Delay</label>
              <select
                className="settings-select"
                value={autosaveDelay}
                onChange={(e) => {
                  setAutosaveDelay(e.target.value)
                  saveSetting('autosave_delay_ms', e.target.value)
                }}
              >
                <option value="500">500ms (Fast)</option>
                <option value="1000">1 second</option>
                <option value="1500">1.5 seconds</option>
                <option value="2000">2 seconds</option>
                <option value="3000">3 seconds</option>
              </select>
            </div>

            <p className="settings-description">
              Backup & Restore: Export your entire diary to a ZIP file, or restore from a previous backup.
            </p>
            <div className="settings-field settings-field--row">
              <button
                className="settings-btn settings-btn--primary"
                onClick={handleExport}
                disabled={isBackingUp}
              >
                {isBackingUp ? 'Working…' : <><Upload size={14} style={{ marginRight: '6px' }} /> Export Backup</>}
              </button>
              <button
                className="settings-btn settings-btn--danger"
                onClick={handleImport}
                disabled={isBackingUp}
              >
                {isBackingUp ? 'Working…' : <><Download size={14} style={{ marginRight: '6px' }} /> Import Backup</>}
              </button>
            </div>
            {backupMessage && (
              <div className={`settings-message settings-message--${backupMessage.type}`}>
                {backupMessage.text}
              </div>
            )}
          </section>

          {/* ── Application Section ─── */}
          <section className="settings-section">
            <h3 className="settings-section__title">ℹ️ Application</h3>
            <p className="settings-description">
              <strong>Velyra</strong> v1.0.0<br />
              A private, offline-first 3D diary application.<br />
              All data is stored locally and encrypted with AES-256-GCM.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
