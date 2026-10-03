import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { DiaryEntry } from '../../../shared/types'
import { WelcomePage, IndexPage, EntryPage, BlankPage } from './PageContent'
import { NewEntryDialog } from './NewEntryDialog'
import { FocusedPageView } from './FocusedPageView'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * A "spread" is two facing pages (left + right) in the open diary.
 *
 * Spread 0:  Welcome (left)  |  Index (right)
 * Spread 1+: Entry pages laid out in pairs.
 *
 * Each entry occupies at least 2 pages (a full spread).
 * First page of an entry shows the title/date/body.
 * Second page is blank (content editing happens in focus mode).
 */

interface PageSpreadData {
  left: React.ReactNode
  right: React.ReactNode
  /** If this spread belongs to an entry, store the entry for focus mode */
  entry?: DiaryEntry
}

export interface PageOverlayHandle {
  navigateToEntry: (entryId: string) => void
  goForward: () => void
  goBackward: () => void
  goToSpread: (spreadIdx: number) => void
  showNewEntryDialog: () => void
  getMaxSpreadIndex: () => number
}

interface PageOverlayProps {
  isOpen: boolean
  onNewEntry: () => void
}

export const PageOverlay = forwardRef<PageOverlayHandle, PageOverlayProps>(function PageOverlay({ isOpen, onNewEntry }, ref) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [pageContents, setPageContents] = useState<Record<string, string>>({})
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward' | null>(null)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [focusedEntry, setFocusedEntry] = useState<DiaryEntry | null>(null)
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const TURN_DURATION = 700

  // ── Load entries from database ────────────────────────────
  const loadEntries = useCallback(async () => {
    try {
      const result = await window.diaryAPI.entries.list() as DiaryEntry[]
      setEntries(result)
      
      const contents: Record<string, string> = {}
      await Promise.all(result.map(async (entry) => {
        try {
          const pages = await window.diaryAPI.pages.getByEntry(entry.id) as any[]
          if (pages && pages.length > 0) {
            contents[entry.id] = pages[0].content || ''
          }
        } catch (e) {
          console.error('[PageOverlay] Failed to load page preview for entry', entry.id)
        }
      }))
      setPageContents(contents)
    } catch (err) {
      console.error('[PageOverlay] Failed to load entries:', err)
    }
  }, [])

  // ── Load saved spread index ───────────────────────────────
  const loadSpreadIndex = useCallback(async () => {
    try {
      const saved = await window.diaryAPI.settings.get('last_spread_index')
      if (saved) {
        const idx = parseInt(saved, 10)
        if (!isNaN(idx) && idx >= 0) setSpreadIndex(idx)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadEntries()
      loadSpreadIndex()
    }
  }, [isOpen, loadEntries, loadSpreadIndex])

  // ── Save spread index when it changes ─────────────────────
  useEffect(() => {
    if (isOpen) {
      window.diaryAPI.settings.set('last_spread_index', String(spreadIndex)).catch(() => {})
    }
  }, [spreadIndex, isOpen])

  // ── Delete entry ───────────────────────────────────────────
  const handleDeleteEntry = useCallback(async (entry: DiaryEntry) => {
    try {
      const result = await window.diaryAPI.entries.delete(entry.id)
      if (result.success) {
        await loadEntries()
        setSpreadIndex(0)
      }
    } catch (err) {
      console.error('[PageOverlay] Failed to delete entry:', err)
    }
  }, [loadEntries])

  // ── Build all spreads ─────────────────────────────────────
  const spreads: PageSpreadData[] = []

  // Spread 0: Welcome + Index
  spreads.push({
    left: (
      <WelcomePage
        onNewEntry={() => setShowNewEntry(true)}
      />
    ),
    right: (
      <IndexPage
        entries={entries}
        onEntryClick={navigateToEntry}
        onNewEntry={() => setShowNewEntry(true)}
        onDeleteEntry={handleDeleteEntry}
      />
    ),
  })

  // Build entry spreads. Each entry gets at least 1 spread (2 pages).
  let pageNum = 3 // Page 1 = welcome, Page 2 = index, entry pages start at 3
  entries.forEach((entry) => {
    spreads.push({
      left: (
        <EntryPage
          entry={entry}
          content={pageContents[entry.id] || ''}
          pageNumber={pageNum++}
          isFirstPage={true}
        />
      ),
      right: (
        <BlankPage
          pageNumber={pageNum++}
        />
      ),
      entry,
    })
  })

  const maxSpreadIndex = Math.max(0, spreads.length - 1)

  // ── Navigation ────────────────────────────────────────────
  function navigateToEntry(entry: DiaryEntry) {
    const entryIdx = entries.findIndex((e) => e.id === entry.id)
    if (entryIdx >= 0) {
      // Entry spreads start at index 1
      setSpreadIndex(entryIdx + 1)
    }
  }

  function navigateToEntryById(entryId: string) {
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      navigateToEntry(entry)
      setFocusedEntry(entry) // Also open in focus/edit mode
    }
  }

  // Expose navigation methods to parent via ref
  useImperativeHandle(ref, () => ({
    navigateToEntry: navigateToEntryById,
    goForward,
    goBackward,
    goToSpread: (idx: number) => {
      if (idx >= 0 && idx <= maxSpreadIndex) {
        setSpreadIndex(idx)
      }
    },
    showNewEntryDialog: () => setShowNewEntry(true),
    getMaxSpreadIndex: () => maxSpreadIndex,
  }), [entries, maxSpreadIndex, isAnimating, spreadIndex, focusedEntry])

  function goForward() {
    if (isAnimating || spreadIndex >= maxSpreadIndex || focusedEntry) return
    setTurnDirection('forward')
    setIsAnimating(true)
    animTimeoutRef.current = setTimeout(() => {
      setSpreadIndex((prev) => Math.min(prev + 1, maxSpreadIndex))
      setIsAnimating(false)
      setTurnDirection(null)
    }, TURN_DURATION)
  }

  function goBackward() {
    if (isAnimating || spreadIndex <= 0 || focusedEntry) return
    setTurnDirection('backward')
    setIsAnimating(true)
    animTimeoutRef.current = setTimeout(() => {
      setSpreadIndex((prev) => Math.max(prev - 1, 0))
      setIsAnimating(false)
      setTurnDirection(null)
    }, TURN_DURATION)
  }

  // ── Focus mode ────────────────────────────────────────────
  function handlePageClick(entry?: DiaryEntry) {
    if (entry && !focusedEntry && !isAnimating) {
      setFocusedEntry(entry)
    }
  }

  function handleFocusClose() {
    setFocusedEntry(null)
  }

  function handleEntrySaved() {
    // Reload entries to reflect any title changes
    loadEntries()
  }

  // ── Keyboard navigation ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || focusedEntry) return

    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input or editor
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        goForward()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goBackward()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAnimating, spreadIndex, maxSpreadIndex, focusedEntry])

  // ── Cleanup ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    }
  }, [])

  // ── Create new entry ──────────────────────────────────────
  async function handleCreateEntry(title: string, date: string) {
    try {
      const result = await window.diaryAPI.entries.create(title, date)
      const data = result as { success: boolean; entry?: DiaryEntry; error?: string }
      if (data.success && data.entry) {
        setShowNewEntry(false)
        await loadEntries()
        // Navigate to the new entry (it will be last)
        const newEntries = await window.diaryAPI.entries.list() as DiaryEntry[]
        const newIdx = newEntries.findIndex((e) => e.id === data.entry!.id)
        if (newIdx >= 0) {
          setSpreadIndex(newIdx + 1)
          // Auto-open in focus/edit mode
          setFocusedEntry(data.entry)
        }
      } else {
        console.error('[PageOverlay] Failed to create entry:', data.error)
      }
    } catch (err) {
      console.error('[PageOverlay] Error creating entry:', err)
    }
  }

  if (!isOpen) return null

  const currentSpread = spreads[spreadIndex] || spreads[0]
  const currentEntry = currentSpread.entry

  // Determine turning page content for animation
  let turningContent: React.ReactNode = null
  if (turnDirection === 'forward' && spreadIndex + 1 <= maxSpreadIndex) {
    turningContent = (spreads[spreadIndex + 1] || spreads[spreadIndex]).left
  } else if (turnDirection === 'backward' && spreadIndex - 1 >= 0) {
    turningContent = (spreads[spreadIndex - 1] || spreads[spreadIndex]).right
  }

  return (
    <>
      <div className="page-overlay">
        {/* Page spread container */}
        <div className="page-spread">
          {/* Left page */}
          <div
            className={`page-panel page-panel--left ${
              turnDirection === 'backward' ? 'page-panel--turning-target' : ''
            } ${currentEntry ? 'page-panel--clickable' : ''}`}
            onClick={() => handlePageClick(currentEntry)}
          >
            {currentSpread.left}
          </div>

          {/* Spine divider */}
          <div className="page-spine-divider" />

          {/* Right page */}
          <div
            className={`page-panel page-panel--right ${
              turnDirection === 'forward' ? 'page-panel--turning-target' : ''
            } ${currentEntry ? 'page-panel--clickable' : ''}`}
            onClick={() => handlePageClick(currentEntry)}
          >
            {currentSpread.right}
          </div>

          {/* Turning page animation overlay */}
          {isAnimating && turnDirection && (
            <div
              className={`page-turn-anim page-turn-anim--${turnDirection}`}
            >
              <div className="page-turn-anim__front">
                {turnDirection === 'forward'
                  ? currentSpread.right
                  : currentSpread.left}
              </div>
              <div className="page-turn-anim__back">
                {turningContent}
              </div>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {spreadIndex > 0 && !focusedEntry && (
          <button
            className="page-nav page-nav--prev"
            onClick={goBackward}
            disabled={isAnimating}
            title="Previous spread (←)"
            aria-label="Previous spread"
          >
            <ChevronLeft size={36} />
          </button>
        )}
        {spreadIndex < maxSpreadIndex && !focusedEntry && (
          <button
            className="page-nav page-nav--next"
            onClick={goForward}
            disabled={isAnimating}
            title="Next spread (→)"
            aria-label="Next spread"
          >
            <ChevronRight size={36} />
          </button>
        )}

        {/* Spread indicator */}
        <div className="spread-indicator">
          {spreads.map((_, idx) => (
            <span
              key={idx}
              className={`spread-dot ${idx === spreadIndex ? 'spread-dot--active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Focused page editor */}
      {focusedEntry && (
        <FocusedPageView
          entry={focusedEntry}
          onClose={handleFocusClose}
          onEntrySaved={handleEntrySaved}
        />
      )}

      {/* New Entry Dialog */}
      {showNewEntry && (
        <NewEntryDialog
          onSubmit={handleCreateEntry}
          onCancel={() => setShowNewEntry(false)}
        />
      )}
    </>
  )
})
