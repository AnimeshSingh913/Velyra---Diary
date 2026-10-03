import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { DiaryEntry, DiaryPage } from '../../../shared/types'
import { DiaryEditor } from './DiaryEditor'

interface FocusedPageViewProps {
  entry: DiaryEntry
  onClose: () => void
  onEntrySaved: () => void
}

/**
 * Full-screen focused page view.
 * Shows entry title/date at top, then the Tiptap rich text editor.
 * Handles content loading, autosave with debouncing, and save status.
 */
export function FocusedPageView({
  entry,
  onClose,
  onEntrySaved,
}: FocusedPageViewProps): React.JSX.Element {
  const [page, setPage] = useState<DiaryPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(entry.title)

  // Track latest content for autosave
  const latestContentRef = useRef<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const AUTOSAVE_DELAY = 1000 // 1 second debounce

  // ── Load page content ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setIsLoading(true)
      try {
        const pages = await window.diaryAPI.pages.getByEntry(entry.id)
        if (!cancelled && pages.length > 0) {
          const currentPage = pages[0]
          
          // Backward compatibility: load external media and migrate to HTML
          const mediaItems = await window.diaryAPI.media.listByPage(currentPage.id)
          let currentContent = currentPage.content || ''
          
          if (mediaItems.length > 0) {
            let needsSave = false
            for (const media of mediaItems) {
              if (!currentContent.includes(media.id)) {
                // Media not found in document, append it
                const src = await window.diaryAPI.media.getPath(media.id)
                if (media.mediaType === 'video') {
                  currentContent += `<video src="${src}" mediaId="${media.id}" width="50%"></video>`
                } else {
                  currentContent += `<img src="${src}" mediaId="${media.id}" width="50%" />`
                }
                needsSave = true
              }
            }
            if (needsSave) {
              // Immediately update the DB so we don't duplicate on next load
              await window.diaryAPI.pages.save(currentPage.id, currentContent)
            }
          }
          
          currentPage.content = currentContent
          setPage(currentPage)
          latestContentRef.current = currentContent
        }
      } catch (err) {
        console.error('[FocusedPage] Failed to load page:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPage()
    return () => { cancelled = true }
  }, [entry.id])

  // ── Save content to DB ────────────────────────────────────
  const saveContent = useCallback(async () => {
    if (!page || isSavingRef.current) return
    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      const result = await window.diaryAPI.pages.save(page.id, latestContentRef.current)
      if (result.success) {
        setSaveStatus('saved')
        onEntrySaved()
        // Auto-clear "Saved" after 2 seconds
        saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        console.error('[FocusedPage] Save failed:', result.error)
      }
    } catch (err) {
      setSaveStatus('error')
      console.error('[FocusedPage] Save error:', err)
    } finally {
      isSavingRef.current = false
    }
  }, [page, onEntrySaved])

  // ── Debounced autosave on content change ──────────────────
  const handleContentChange = useCallback((html: string) => {
    latestContentRef.current = html

    // Clear previous debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      saveContent()
    }, AUTOSAVE_DELAY)
  }, [saveContent])

  // ── Immediate save ────────────────────────────────────────
  const handleImmediateSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    saveContent()
  }, [saveContent])

  // ── Save on close / Escape ────────────────────────────────
  const handleClose = useCallback(() => {
    // Save before closing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    saveContent().then(() => onClose())
  }, [saveContent, onClose])

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !editingTitle) {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, editingTitle])

  // ── Cleanup timers ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  // ── Title editing ─────────────────────────────────────────
  const handleTitleBlur = useCallback(async () => {
    setEditingTitle(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== entry.title) {
      try {
        await window.diaryAPI.entries.update(entry.id, { title: trimmed })
        onEntrySaved()
      } catch (err) {
        console.error('[FocusedPage] Failed to update title:', err)
      }
    }
  }, [title, entry.id, entry.title, onEntrySaved])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
  }, [])

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="focused-page-overlay">
      <div className="focused-page-backdrop" onClick={handleClose} />

      <div className="focused-page">
        {/* Header bar */}
        <div className="focused-page__header">
          <button
            className="focused-page__back"
            onClick={handleClose}
            title="Back to diary (Escape)"
          >
            ← Back to Diary
          </button>
          <div className="focused-page__entry-info">
            {editingTitle ? (
              <input
                className="focused-page__title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                maxLength={200}
              />
            ) : (
              <h2
                className="focused-page__title"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {entry.title}
              </h2>
            )}
            <span className="focused-page__date">{formatDate(entry.date)}</span>
          </div>
        </div>

        {/* Editor area */}
        <div className="focused-page__body">
          {isLoading ? (
            <div className="focused-page__loading">
              <div className="loading-spinner" />
              <p>Loading page…</p>
            </div>
          ) : page ? (
            <>
              <DiaryEditor
                pageId={page.id}
                entryId={entry.id}
                initialContent={page.content || ''}
                onContentChange={handleContentChange}
                onSave={handleImmediateSave}
                saveStatus={saveStatus}
              />
            </>
          ) : (
            <div className="focused-page__error">
              <p>Could not load page content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
