import React, { useState } from 'react'
import type { DiaryEntry } from '../../../shared/types'

// ─── Welcome Page ────────────────────────────────────────────

interface WelcomePageProps {
  onNewEntry?: () => void
}

export function WelcomePage({ onNewEntry }: WelcomePageProps): React.JSX.Element {
  return (
    <div className="page-content page-content--welcome">
      <div className="welcome-ornament">✦ ✧ ✦</div>
      <h1 className="welcome-title">Welcome to Your Diary</h1>
      <div className="welcome-divider" />
      <div className="welcome-body">
        <p>These pages belong only to you.</p>
        <p>Write your thoughts, memories, ideas, plans and moments here.</p>
        <p>There is no right way to fill these pages.</p>
        <p className="welcome-accent">Your story begins here.</p>
      </div>
      <div className="welcome-divider" />
      <div className="welcome-footer">
        <button className="welcome-new-entry" onClick={onNewEntry}>
          + Create your first entry
        </button>
      </div>
    </div>
  )
}

// ─── Index Page ──────────────────────────────────────────────

interface IndexPageProps {
  entries: DiaryEntry[]
  onEntryClick: (entry: DiaryEntry) => void
  onNewEntry: () => void
  onDeleteEntry?: (entry: DiaryEntry) => void
}

export function IndexPage({
  entries,
  onEntryClick,
  onNewEntry,
  onDeleteEntry,
}: IndexPageProps): React.JSX.Element {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div className="page-content page-content--index">
      <h2 className="index-title">Index</h2>
      <div className="index-divider" />

      {entries.length === 0 ? (
        <div className="index-empty">
          <p className="index-empty-text">Your story begins here.</p>
          <button className="index-new-entry-btn" onClick={onNewEntry}>
            + Create your first entry
          </button>
        </div>
      ) : (
        <div className="index-list">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="index-entry-row">
              {confirmDeleteId === entry.id ? (
                <div className="index-entry-confirm">
                  <span className="index-entry-confirm__text">Delete this diary entry?</span>
                  <button
                    className="index-entry-confirm__btn index-entry-confirm__btn--cancel"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                  >
                    Cancel
                  </button>
                  <button
                    className="index-entry-confirm__btn index-entry-confirm__btn--delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(null)
                      onDeleteEntry?.(entry)
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  className="index-entry"
                  onClick={() => onEntryClick(entry)}
                >
                  <span className="index-entry__number">{idx + 1}.</span>
                  <span className="index-entry__info">
                    <span className="index-entry__title">{entry.title}</span>
                    <span className="index-entry__date">
                      {formatDate(entry.date)}
                    </span>
                  </span>
                  <span className="index-entry__page">p.{(idx + 1) * 2 + 1}</span>
                  {onDeleteEntry && (
                    <span
                      className="index-entry__delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteId(entry.id)
                      }}
                      title="Delete entry"
                    >
                      ✕
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
          <div className="index-new-entry-row">
            <button className="index-new-entry-btn" onClick={onNewEntry}>
              + New Entry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Entry Page ──────────────────────────────────────────────

interface EntryPageProps {
  entry: DiaryEntry
  content: string
  pageNumber: number
  isFirstPage?: boolean
}

export function EntryPage({
  entry,
  content,
  pageNumber,
  isFirstPage,
}: EntryPageProps): React.JSX.Element {
  return (
    <div className="page-content page-content--entry">
      {isFirstPage && (
        <div className="entry-header">
          <h2 className="entry-title">{entry.title}</h2>
          <p className="entry-date">{formatDate(entry.date)}</p>
          <div className="entry-divider" />
        </div>
      )}
      <div
        className="entry-body"
        dangerouslySetInnerHTML={{ __html: content || '<p class="entry-placeholder">This page is empty. Click to start writing...</p>' }}
      />
      <div className="page-number">{pageNumber}</div>
    </div>
  )
}

// ─── Blank Page ──────────────────────────────────────────────

interface BlankPageProps {
  pageNumber?: number
}

export function BlankPage({ pageNumber }: BlankPageProps): React.JSX.Element {
  return (
    <div className="page-content page-content--blank">
      {pageNumber !== undefined && (
        <div className="page-number">{pageNumber}</div>
      )}
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
