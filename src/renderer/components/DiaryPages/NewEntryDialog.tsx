import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'

interface NewEntryDialogProps {
  onSubmit: (title: string, date: string) => void
  onCancel: () => void
}

/**
 * Dialog for creating a new diary entry.
 * Captures title and date.
 */
export function NewEntryDialog({
  onSubmit,
  onCancel,
}: NewEntryDialogProps): React.JSX.Element {
  const today = new Date().toISOString().split('T')[0]
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Please enter a title for your entry.')
      return
    }
    if (!date) {
      setError('Please select a date.')
      return
    }

    onSubmit(trimmedTitle, date)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="new-entry-overlay" onKeyDown={handleKeyDown}>
      <div className="new-entry-backdrop" onClick={onCancel} />
      <form className="new-entry-dialog" onSubmit={handleSubmit}>
        <div className="new-entry-dialog__ornament">
          <Sparkles size={24} />
        </div>
        <h2 className="new-entry-dialog__title">New Diary Entry</h2>
        <p className="new-entry-dialog__subtitle">
          Begin a new page in your story.
        </p>

        <div className="new-entry-dialog__field">
          <label htmlFor="entry-title" className="new-entry-dialog__label">
            Title
          </label>
          <input
            ref={inputRef}
            id="entry-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="new-entry-dialog__input"
            placeholder="Today's thoughts…"
            autoComplete="off"
            maxLength={200}
          />
        </div>

        <div className="new-entry-dialog__field">
          <label htmlFor="entry-date" className="new-entry-dialog__label">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="new-entry-dialog__input new-entry-dialog__input--date"
          />
        </div>

        {error && (
          <div className="new-entry-dialog__error">
            <span className="new-entry-dialog__error-icon">
              <AlertTriangle size={16} />
            </span>
            {error}
          </div>
        )}

        <div className="new-entry-dialog__actions">
          <button
            type="button"
            className="new-entry-dialog__btn new-entry-dialog__btn--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="new-entry-dialog__btn new-entry-dialog__btn--submit"
          >
            Create Entry
          </button>
        </div>
      </form>
    </div>
  )
}
