import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DiarySceneReact } from './components/Diary3D/DiarySceneReact'
import { DiaryScene } from './components/Diary3D/DiaryScene'
import { PasswordDialog } from './components/Auth/PasswordDialog'
import { PageOverlay } from './components/DiaryPages/PageOverlay'
import type { PageOverlayHandle } from './components/DiaryPages/PageOverlay'
import { SearchPanel } from './components/UI/SearchPanel'
import { SettingsPanel } from './components/UI/SettingsPanel'
import { CommandBar } from './components/CommandBar/CommandBar'
import { Search, Settings, X, Loader2 } from 'lucide-react'

type AppState = 'loading' | 'closed' | 'password-prompt' | 'open'

function App(): React.JSX.Element {
  const [appState, setAppState] = useState<AppState>('loading')
  const [isFirstRun, setIsFirstRun] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const sceneRef = useRef<DiaryScene | null>(null)
  const pageOverlayRef = useRef<PageOverlayHandle | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Initialize ─────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const firstRun = await window.diaryAPI.auth.checkFirstRun()
        setIsFirstRun(firstRun)
      } catch {
        // Expected when running outside Electron (dev browser)
        setIsFirstRun(true)
      }
      setAppState('closed')
    }
    init()
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+F to toggle search (only when diary is open)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && appState === 'open') {
        e.preventDefault()
        setShowSearch(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [appState])

  // ── Handlers (stable with useCallback) ─────────────────────

  /**
   * When the 3D book is clicked:
   * Show the password prompt instead of opening directly.
   */
  const handleBookClicked = useCallback(() => {
    setAppState('password-prompt')
  }, [])

  /**
   * On successful authentication:
   * Close the dialog and trigger the book open animation.
   */
  const handleAuthSuccess = useCallback(() => {
    setAppState('closed') // Brief reset so the hint disappears
    // Small delay then open the book
    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.openBook()
      }
    }, 200)
  }, [])

  /**
   * Cancel the password dialog — return to closed state.
   */
  const handleAuthCancel = useCallback(() => {
    setAppState('closed')
  }, [])

  const handleOpenComplete = useCallback(() => {
    setAppState('open')
  }, [])

  const handleCloseComplete = useCallback(() => {
    setAppState('closed')
  }, [])

  const handleCloseDiary = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.closeBook()
    }
  }, [])

  const handleNewEntry = useCallback(() => {
    // The PageOverlay handles this internally; this is a no-op callback
    // available if top-level orchestration is needed later
  }, [])

  const handleNavigateToEntry = useCallback((entryId: string) => {
    if (pageOverlayRef.current) {
      pageOverlayRef.current.navigateToEntry(entryId)
    }
  }, [])

  // ── Command bar callbacks ──────────────────────────────────

  const handleCmdNextPage = useCallback(() => {
    if (pageOverlayRef.current) {
      pageOverlayRef.current.goForward()
    }
  }, [])

  const handleCmdPreviousPage = useCallback(() => {
    if (pageOverlayRef.current) {
      pageOverlayRef.current.goBackward()
    }
  }, [])

  const handleCmdOpenPage = useCallback((pageNumber: number) => {
    if (pageOverlayRef.current) {
      // Pages are organized in spreads: spread 0 = pages 1,2 (welcome+index)
      // spread 1 = pages 3,4, etc. Map page number to spread index.
      const spreadIdx = pageNumber <= 2 ? 0 : Math.ceil((pageNumber - 2) / 2)
      pageOverlayRef.current.goToSpread(spreadIdx)
    }
  }, [])

  const handleCmdOpenIndex = useCallback(() => {
    if (pageOverlayRef.current) {
      pageOverlayRef.current.goToSpread(0)
    }
  }, [])

  const handleCmdNewEntry = useCallback(() => {
    if (pageOverlayRef.current) {
      pageOverlayRef.current.showNewEntryDialog()
    }
  }, [])

  const handleCmdSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setShowSearch(true)
  }, [])

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Three.js 3D scene — always mounted after loading */}
      {appState !== 'loading' && (
        <DiarySceneReact
          sceneRef={sceneRef}
          onBookClicked={handleBookClicked}
          onOpenComplete={handleOpenComplete}
          onCloseComplete={handleCloseComplete}
        />
      )}

      {/* Loading overlay */}
      {appState === 'loading' && (
        <div className="overlay overlay--center">
          <Loader2 className="loading-spinner-icon" />
          <p className="loading-text">Initializing...</p>
        </div>
      )}

      {/* Closed state hint */}
      {appState === 'closed' && (
        <div className="diary-hint">
          <p>Click the diary to open</p>
        </div>
      )}

      {/* Password dialog (overlays the 3D scene) */}
      {appState === 'password-prompt' && (
        <PasswordDialog
          mode={isFirstRun ? 'create' : 'login'}
          onSuccess={handleAuthSuccess}
          onCancel={handleAuthCancel}
        />
      )}

      {/* Open state — Page spread + controls */}
      {appState === 'open' && (
        <div className="diary-open-ui">
          {/* Top bar with search & settings */}
          <div className="diary-top-bar">
            <button
              className="diary-top-bar__btn"
              onClick={() => setShowSearch(true)}
              title="Search (Ctrl+F)"
            >
              <Search size={18} />
            </button>
            <button
              className="diary-top-bar__btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              className="diary-top-bar__btn"
              onClick={handleCloseDiary}
              title="Close Diary"
            >
              <X size={18} />
            </button>
          </div>

          <PageOverlay
            ref={pageOverlayRef}
            isOpen={appState === 'open'}
            onNewEntry={handleNewEntry}
          />
        </div>
      )}

      {/* Search Panel */}
      <SearchPanel
        isOpen={showSearch}
        onClose={() => { setShowSearch(false); setSearchQuery('') }}
        onNavigateToEntry={handleNavigateToEntry}
        initialQuery={searchQuery}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Command Bar (text command controller) */}
      <CommandBar
        isOpen={appState === 'open'}
        onNextPage={handleCmdNextPage}
        onPreviousPage={handleCmdPreviousPage}
        onOpenPage={handleCmdOpenPage}
        onOpenIndex={handleCmdOpenIndex}
        onNewEntry={handleCmdNewEntry}
        onSearch={handleCmdSearch}
      />
    </div>
  )
}

export default App
