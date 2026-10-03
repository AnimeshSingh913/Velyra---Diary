import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../../../shared/types'

interface MediaGalleryProps {
  pageId: string
  entryId: string
  onMediaChange: () => void
}

/**
 * Displays imported media (images & videos) below the text editor.
 * Supports resizing via corner handles, deletion, and drag repositioning.
 */
export function MediaGallery({
  pageId,
  entryId,
  onMediaChange,
}: MediaGalleryProps): React.JSX.Element {
  const [items, setItems] = useState<MediaItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Load media items ──────────────────────────────────────
  const loadMedia = useCallback(async () => {
    try {
      const result = await window.diaryAPI.media.listByPage(pageId)
      setItems(result)
    } catch (err) {
      console.error('[MediaGallery] Failed to load media:', err)
    }
  }, [pageId])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  // ── Import handlers ───────────────────────────────────────
  const handleImportImage = useCallback(async () => {
    const result = await window.diaryAPI.media.importImage(pageId, entryId)
    if (result.success && result.media) {
      await loadMedia()
      onMediaChange()
    }
  }, [pageId, entryId, loadMedia, onMediaChange])

  const handleImportVideo = useCallback(async () => {
    const result = await window.diaryAPI.media.importVideo(pageId, entryId)
    if (result.success && result.media) {
      await loadMedia()
      onMediaChange()
    }
  }, [pageId, entryId, loadMedia, onMediaChange])

  // ── Delete handler ────────────────────────────────────────
  const handleDelete = useCallback(async (mediaId: string) => {
    const result = await window.diaryAPI.media.delete(mediaId)
    if (result.success) {
      setSelectedId(null)
      await loadMedia()
      onMediaChange()
    }
  }, [loadMedia, onMediaChange])

  // ── Resize handler ────────────────────────────────────────
  const handleResize = useCallback(async (
    mediaId: string,
    newWidth: number,
    newHeight: number
  ) => {
    await window.diaryAPI.media.updatePosition(mediaId, {
      width: newWidth,
      height: newHeight,
    })
    setItems(prev => prev.map(item =>
      item.id === mediaId ? { ...item, width: newWidth, height: newHeight } : item
    ))
  }, [])

  // ── Click outside to deselect ─────────────────────────────
  const galleryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (galleryRef.current && !galleryRef.current.contains(e.target as Node)) {
        setSelectedId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Escape deselects
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' && selectedId) {
        handleDelete(selectedId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, handleDelete])

  return (
    <div className="media-gallery" ref={galleryRef}>
      {/* Media import buttons */}
      <div className="media-gallery__actions">
        <button className="media-import-btn" onClick={handleImportImage} title="Add Image">
          🖼 Add Image
        </button>
        <button className="media-import-btn" onClick={handleImportVideo} title="Add Video">
          🎬 Add Video
        </button>
      </div>

      {/* Media items */}
      {items.length > 0 && (
        <div className="media-gallery__items">
          {items.map((item) => (
            <MediaItemView
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onDelete={() => handleDelete(item.id)}
              onResize={handleResize}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual Media Item ──────────────────────────────────

interface MediaItemViewProps {
  item: MediaItem
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onResize: (mediaId: string, width: number, height: number) => void
}

function MediaItemView({
  item,
  isSelected,
  onSelect,
  onDelete,
  onResize,
}: MediaItemViewProps): React.JSX.Element {
  const [fileSrc, setFileSrc] = useState<string | null>(null)
  const [size, setSize] = useState({ width: item.width, height: item.height })
  const containerRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)

  // Load the file:// URL
  useEffect(() => {
    async function load() {
      const path = await window.diaryAPI.media.getPath(item.id)
      setFileSrc(path)
    }
    load()
  }, [item.id])

  // ── Resize via corner handle ──────────────────────────────
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = true

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height
    const aspectRatio = startWidth / startHeight

    function onMouseMove(ev: MouseEvent) {
      if (!isResizingRef.current) return
      const dx = ev.clientX - startX
      const newWidth = Math.max(60, startWidth + dx)
      const newHeight = newWidth / aspectRatio
      setSize({ width: newWidth, height: newHeight })
    }

    function onMouseUp() {
      isResizingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      // Persist the final size
      setSize(prev => {
        onResize(item.id, prev.width, prev.height)
        return prev
      })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [size.width, size.height, item.id, onResize])

  return (
    <div
      ref={containerRef}
      className={`media-item ${isSelected ? 'media-item--selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      style={{ width: `${size.width}%` }}
    >
      {item.mediaType === 'image' && fileSrc && (
        <img
          src={fileSrc}
          alt={item.originalName}
          className="media-item__image"
          draggable={false}
        />
      )}

      {item.mediaType === 'video' && fileSrc && (
        <video
          src={fileSrc}
          className="media-item__video"
          controls
          preload="metadata"
        />
      )}

      {!fileSrc && (
        <div className="media-item__placeholder">
          Loading {item.mediaType}…
        </div>
      )}

      {/* Selection bounding box with controls */}
      {isSelected && (
        <>
          <div className="media-item__bbox" />
          <button
            className="media-item__delete"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete (Del)"
          >
            ✕
          </button>
          <div
            className="media-item__resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
          <div className="media-item__name">{item.originalName}</div>
        </>
      )}
    </div>
  )
}
