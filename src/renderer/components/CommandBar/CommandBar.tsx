import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  commandController,
  type CommandResult,
  type CommandSuggestion,
} from './CommandController'
import { Check, X } from 'lucide-react'

interface CommandBarProps {
  /** Whether the diary is in 'open' state (command bar only available when open) */
  isOpen: boolean
  /** Callback: go to next page spread */
  onNextPage: () => void
  /** Callback: go to previous page spread */
  onPreviousPage: () => void
  /** Callback: open a specific spread by page number */
  onOpenPage: (pageNumber: number) => void
  /** Callback: navigate to the index (spread 0) */
  onOpenIndex: () => void
  /** Callback: trigger the new-entry dialog */
  onNewEntry: () => void
  /** Callback: open the search panel with a pre-filled query */
  onSearch: (query: string) => void
}

/**
 * CommandBar — A compact, keyboard-driven text command interface.
 *
 * Activated with Ctrl+K (or clicking the ⌘ button).
 * Provides fuzzy autocomplete suggestions and executes commands
 * through the standalone CommandController.
 */
export function CommandBar({
  isOpen,
  onNextPage,
  onPreviousPage,
  onOpenPage,
  onOpenIndex,
  onNewEntry,
  onSearch,
}: CommandBarProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [result, setResult] = useState<CommandResult | null>(null)
  const [resultFading, setResultFading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Register callbacks with the controller ─────────────────
  useEffect(() => {
    commandController.registerCallbacks({
      onNextPage,
      onPreviousPage,
      onOpenPage,
      onOpenIndex,
      onNewEntry,
      onSearch,
    })
    return () => commandController.unregisterCallbacks()
  }, [onNextPage, onPreviousPage, onOpenPage, onOpenIndex, onNewEntry, onSearch])

  // ── Keyboard shortcut to toggle (Ctrl+K) ───────────────────
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setVisible((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // ── Focus input when panel becomes visible ─────────────────
  useEffect(() => {
    if (visible) {
      setInput('')
      setResult(null)
      setSelectedIdx(0)
      setSuggestions(commandController.getSuggestions(''))
      // Delay focus to after mount animation
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [visible])

  // ── Close when diary closes ────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setVisible(false)
    }
  }, [isOpen])

  // ── Update suggestions as user types ───────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInput(value)
      setResult(null)
      const suggs = commandController.getSuggestions(value)
      setSuggestions(suggs)
      setSelectedIdx(0)
    },
    [],
  )

  // ── Execute the current command ────────────────────────────
  const executeCommand = useCallback(
    (commandText?: string) => {
      const text = commandText ?? input
      if (!text.trim()) return

      const res = commandController.run(text)
      setResult(res)
      setResultFading(false)

      // Clear any previous timer
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current)

      if (res.success) {
        // Auto-close on success after a short delay
        resultTimerRef.current = setTimeout(() => {
          setResultFading(true)
          setTimeout(() => {
            setVisible(false)
            setResult(null)
            setResultFading(false)
          }, 200)
        }, 800)
      }
    },
    [input],
  )

  // ── Keyboard navigation within the bar ─────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setVisible(false)
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        // If a suggestion is highlighted, use it
        if (suggestions.length > 0 && !input.trim()) {
          executeCommand(suggestions[selectedIdx].command)
        } else {
          executeCommand()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((prev) => Math.max(prev - 1, 0))
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        // Tab-complete with the selected suggestion
        if (suggestions.length > 0) {
          const cmd = suggestions[selectedIdx].command
          setInput(cmd)
          setSuggestions(commandController.getSuggestions(cmd))
          setSelectedIdx(0)
        }
        return
      }
    },
    [suggestions, selectedIdx, input, executeCommand],
  )

  // ── Click a suggestion ─────────────────────────────────────
  const handleSuggestionClick = useCallback(
    (suggestion: CommandSuggestion) => {
      setInput(suggestion.command)
      executeCommand(suggestion.command)
    },
    [executeCommand],
  )

  // ── Cleanup timers on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current)
    }
  }, [])

  // ── Don't render when diary is not open ────────────────────
  if (!isOpen) return null

  return (
    <>
      {/* Toggle button in the top bar area */}
      {!visible && (
        <button
          className="command-bar-trigger"
          onClick={() => setVisible(true)}
          title="Command Bar (Ctrl+K)"
          aria-label="Open command bar"
        >
          <span className="command-bar-trigger__icon">⌘</span>
          <span className="command-bar-trigger__shortcut">Ctrl+K</span>
        </button>
      )}

      {/* Command bar overlay */}
      {visible && (
        <div className="command-bar">
          <div
            className="command-bar__backdrop"
            onClick={() => setVisible(false)}
          />
          <div className={`command-bar__container ${resultFading ? 'command-bar__container--fading' : ''}`}>
            {/* Input area */}
            <div className="command-bar__input-row">
              <span className="command-bar__prompt">⌘</span>
              <input
                ref={inputRef}
                className="command-bar__input"
                type="text"
                placeholder="Type a command…"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="command-bar__kbd">Esc</kbd>
            </div>

            {/* Result message */}
            {result && (
              <div
                className={`command-bar__result ${
                  result.success
                    ? 'command-bar__result--success'
                    : 'command-bar__result--error'
                }`}
              >
                <span className="command-bar__result-icon">
                  {result.success ? <Check size={16} /> : <X size={16} />}
                </span>
                {result.message}
              </div>
            )}

            {/* Suggestions list */}
            {!result && suggestions.length > 0 && (
              <div className="command-bar__suggestions">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion.command}
                    className={`command-bar__suggestion ${
                      idx === selectedIdx
                        ? 'command-bar__suggestion--active'
                        : ''
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <span className="command-bar__suggestion-icon">
                      {suggestion.icon}
                    </span>
                    <div className="command-bar__suggestion-body">
                      <span className="command-bar__suggestion-label">
                        {suggestion.label}
                      </span>
                      <span className="command-bar__suggestion-desc">
                        {suggestion.description}
                      </span>
                    </div>
                    <span className="command-bar__suggestion-cmd">
                      {suggestion.command}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state when filter yields no results */}
            {!result && suggestions.length === 0 && input.trim() && (
              <div className="command-bar__empty">
                No matching command. Press <kbd>Enter</kbd> to try anyway.
              </div>
            )}

            {/* Footer hint */}
            <div className="command-bar__footer">
              <span>
                <kbd>↑↓</kbd> Navigate
              </span>
              <span>
                <kbd>Tab</kbd> Complete
              </span>
              <span>
                <kbd>Enter</kbd> Execute
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
