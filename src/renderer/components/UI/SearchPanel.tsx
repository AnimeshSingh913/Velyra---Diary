import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { SearchResult } from '../../../shared/types'

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToEntry: (entryId: string) => void
  /** Optional initial query text (e.g. from the command bar) */
  initialQuery?: string
}

/**
 * Search panel that slides in from the top.
 * Searches entry titles and body text with debounced queries.
 */
export function SearchPanel({
  isOpen,
  onClose,
  onNavigateToEntry,
  initialQuery,
}: SearchPanelProps): React.JSX.Element | null {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when panel opens, and apply initialQuery if provided
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (isOpen && initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
    if (!isOpen) {
      setQuery('')
      setResults([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery])

  // Debounced search
  const performSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await window.diaryAPI.search.query(searchText)
      setResults(res as SearchResult[])
    } catch (err) {
      console.error('[Search] Error:', err)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(value), 300)
  }, [performSearch])

  // Escape to close
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

  // Click result to navigate
  const handleResultClick = useCallback((result: SearchResult) => {
    onNavigateToEntry(result.entryId)
    onClose()
  }, [onNavigateToEntry, onClose])

  if (!isOpen) return null

  return (
    <div className="search-panel">
      <div className="search-panel__backdrop" onClick={onClose} />
      <div className="search-panel__container">
        <div className="search-panel__input-row">
          <span className="search-panel__icon">
            <Search size={18} />
          </span>
          <input
            ref={inputRef}
            className="search-panel__input"
            type="text"
            placeholder="Search diary entries…"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <button className="search-panel__close" onClick={onClose} title="Close (Escape)">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="search-panel__results">
          {isSearching && (
            <div className="search-panel__status">Searching…</div>
          )}
          {!isSearching && query.trim() && results.length === 0 && (
            <div className="search-panel__status">No matching entries found.</div>
          )}
          {results.map((result, idx) => (
            <button
              key={`${result.entryId}-${idx}`}
              className="search-result"
              onClick={() => handleResultClick(result)}
            >
              <div className="search-result__title">{result.title}</div>
              <div className="search-result__meta">
                <span className="search-result__date">{formatDate(result.date)}</span>
              </div>
              <div className="search-result__preview">{result.preview}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}
