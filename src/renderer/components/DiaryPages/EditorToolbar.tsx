import React, { useCallback, useState, useRef } from 'react'
import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor
  onInsertImage: () => void
  onInsertVideo: () => void
}

const FONT_FAMILIES = [
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Sans-serif', value: '"Segoe UI", Arial, sans-serif' },
  { label: 'Monospace', value: '"Consolas", monospace' },
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

const TEXT_COLORS = [
  '#2a1810', '#3a2820', '#5a4030', '#8a7060',
  '#b43228', '#c5933a', '#3a9a5a', '#2a6eb5',
  '#6b2d8b', '#000000',
]

const HIGHLIGHT_COLORS = [
  '#fef3c7', '#fde68a', '#fcd34d',
  '#d9f99d', '#a7f3d0', '#bfdbfe',
  '#e9d5ff', '#fecdd3', '#fed7aa',
  'transparent',
]

/**
 * Rich text formatting toolbar for the diary editor.
 * Two-row layout: text formatting on top, paragraph formatting below.
 */
export function EditorToolbar({ editor, onInsertImage, onInsertVideo }: EditorToolbarProps): React.JSX.Element {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showLinkPrompt, setShowLinkPrompt] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [savedSelection, setSavedSelection] = useState<any>(null)

  const closeAllMenus = useCallback(() => {
    setShowColorPicker(false)
    setShowHighlightPicker(false)
    setShowFontMenu(false)
    setShowSizeMenu(false)
    setShowLinkPrompt(false)
  }, [])

  return (
    <div className="editor-toolbar" onClick={(e) => e.stopPropagation()}>

      {/* Row 1: History, Text (Headings, Font, Size, Styles), Color */}
      <div className="editor-toolbar__row">
        {/* History */}
        <div className="toolbar-group">
          <ToolbarButton
            icon="↩"
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <ToolbarButton
            icon="↪"
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </div>

        <div className="toolbar-divider" />

        {/* Text */}
        <div className="toolbar-group">
          <ToolbarButton
            icon="H1"
            title="Heading 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            icon="H2"
            title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            icon="H3"
            title="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <ToolbarButton
            icon="¶"
            title="Paragraph"
            active={editor.isActive('paragraph') && !editor.isActive('heading')}
            onClick={() => editor.chain().focus().setParagraph().run()}
          />
        </div>

        <div className="toolbar-group toolbar-group--dropdown">
          <button
            className="toolbar-dropdown-btn"
            title="Font Family"
            onClick={() => { closeAllMenus(); setShowFontMenu(!showFontMenu) }}
          >
            <span className="toolbar-dropdown-label">Font</span>
            <span className="toolbar-dropdown-arrow">▾</span>
          </button>
          {showFontMenu && (
            <div className="toolbar-dropdown-menu">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.value}
                  className="toolbar-dropdown-item"
                  style={{ fontFamily: f.value }}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(f.value).run()
                    setShowFontMenu(false)
                  }}
                >
                  {f.label}
                </button>
              ))}
              <button
                className="toolbar-dropdown-item toolbar-dropdown-item--clear"
                onClick={() => {
                  editor.chain().focus().unsetFontFamily().run()
                  setShowFontMenu(false)
                }}
              >
                Default
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-group toolbar-group--dropdown">
          <button
            className="toolbar-dropdown-btn"
            title="Font Size"
            onClick={() => { closeAllMenus(); setShowSizeMenu(!showSizeMenu) }}
          >
            <span className="toolbar-dropdown-label">Size</span>
            <span className="toolbar-dropdown-arrow">▾</span>
          </button>
          {showSizeMenu && (
            <div className="toolbar-dropdown-menu">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  className="toolbar-dropdown-item"
                  onClick={() => {
                    editor.chain().focus().setFontSize(s).run()
                    setShowSizeMenu(false)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-group">
          <ToolbarButton
            icon="B"
            title="Bold (Ctrl+B)"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="toolbar-btn--bold"
          />
          <ToolbarButton
            icon="I"
            title="Italic (Ctrl+I)"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="toolbar-btn--italic"
          />
          <ToolbarButton
            icon="U"
            title="Underline (Ctrl+U)"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="toolbar-btn--underline"
          />
          <ToolbarButton
            icon="S"
            title="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="toolbar-btn--strike"
          />
          <ToolbarButton
            icon="X²"
            title="Superscript"
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          />
          <ToolbarButton
            icon="X₂"
            title="Subscript"
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          />
          <ToolbarButton
            icon="Tₓ"
            title="Clear Formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          />
          <div className="toolbar-divider" />
          <div className="toolbar-group toolbar-group--dropdown">
            <ToolbarButton
              icon="🔗"
              title="Link"
              active={editor.isActive('link')}
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run()
                } else {
                  closeAllMenus()
                  setSavedSelection(editor.state.selection)
                  setLinkUrl('')
                  setShowLinkPrompt(!showLinkPrompt)
                }
              }}
            />
            {showLinkPrompt && (
              <div className="toolbar-dropdown-menu" style={{ padding: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (linkUrl) {
                        editor.chain().focus().setTextSelection(savedSelection).setLink({ href: linkUrl }).run()
                      } else {
                        editor.chain().focus().setTextSelection(savedSelection).run()
                      }
                      setShowLinkPrompt(false)
                    } else if (e.key === 'Escape') {
                      editor.chain().focus().setTextSelection(savedSelection).run()
                      setShowLinkPrompt(false)
                    }
                  }}
                  autoFocus
                  style={{
                    padding: '4px 8px',
                    border: '1px solid rgba(160, 130, 80, 0.3)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    outline: 'none',
                    width: '200px'
                  }}
                />
                <button
                  onClick={() => {
                    if (linkUrl) {
                      editor.chain().focus().setTextSelection(savedSelection).setLink({ href: linkUrl }).run()
                    } else {
                      editor.chain().focus().setTextSelection(savedSelection).run()
                    }
                    setShowLinkPrompt(false)
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#8a7060',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          {editor.isActive('link') && (
            <ToolbarButton
              icon="↗"
              title="Open Link in Browser"
              onClick={() => {
                const href = editor.getAttributes('link').href
                if (href) {
                  window.diaryAPI?.system?.openExternal(href)
                }
              }}
            />
          )}
        </div>

        <div className="toolbar-divider" />

        {/* Color */}
        <div className="toolbar-group toolbar-group--dropdown">
          <button
            className="toolbar-btn toolbar-btn--color"
            title="Text Color"
            onClick={() => { closeAllMenus(); setShowColorPicker(!showColorPicker) }}
          >
            <span>A</span>
            <span
              className="color-indicator"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || '#2a1810' }}
            />
          </button>
          {showColorPicker && (
            <div className="toolbar-color-grid">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  className="toolbar-color-swatch"
                  style={{ backgroundColor: c }}
                  title={c}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run()
                    setShowColorPicker(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-group toolbar-group--dropdown">
          <button
            className="toolbar-btn toolbar-btn--highlight"
            title="Highlight Color"
            onClick={() => { closeAllMenus(); setShowHighlightPicker(!showHighlightPicker) }}
          >
            <span>⊞</span>
          </button>
          {showHighlightPicker && (
            <div className="toolbar-color-grid">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  className={`toolbar-color-swatch ${c === 'transparent' ? 'toolbar-color-swatch--clear' : ''}`}
                  style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}
                  title={c === 'transparent' ? 'Remove highlight' : c}
                  onClick={() => {
                    if (c === 'transparent') {
                      editor.chain().focus().unsetHighlight().run()
                    } else {
                      editor.chain().focus().toggleHighlight({ color: c }).run()
                    }
                    setShowHighlightPicker(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Paragraph, Lists, Insert */}
      <div className="editor-toolbar__row">
        {/* Paragraph Alignment */}
        <div className="toolbar-group">
          <ToolbarButton
            icon="≡ₗ"
            title="Align Left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          />
          <ToolbarButton
            icon="≡"
            title="Center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          />
          <ToolbarButton
            icon="≡ᵣ"
            title="Align Right"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          />
          <ToolbarButton
            icon="≡ⱼ"
            title="Justify"
            active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          />
          <div className="toolbar-divider" />
          <ToolbarButton
            icon="⇥"
            title="Increase Indent (Tab)"
            onClick={() => editor.commands.indent()}
          />
          <ToolbarButton
            icon="⇤"
            title="Decrease Indent (Shift+Tab)"
            onClick={() => editor.commands.outdent()}
          />
        </div>

        <div className="toolbar-divider" />

        {/* Lists & Quotes */}
        <div className="toolbar-group">
          <ToolbarButton
            icon="•"
            title="Bullet List"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon="1."
            title="Numbered List"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            icon="☐"
            title="Checklist"
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
          <ToolbarButton
            icon="❝"
            title="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
        </div>

        <div className="toolbar-divider" />

        {/* Insert */}
        <div className="toolbar-group">
          <ToolbarButton
            icon="🖼️"
            title="Insert Image"
            onClick={onInsertImage}
          />
          <ToolbarButton
            icon="🎥"
            title="Insert Video"
            onClick={onInsertVideo}
          />
          <ToolbarButton
            icon="—"
            title="Horizontal Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
          <ToolbarButton
            icon="⊞"
            title="Insert Table"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          />
        </div>
      </div>

      {/* Row 3: Table Controls (Contextual) */}
      {editor.isActive('table') && (
        <div className="editor-toolbar__row" style={{ background: 'rgba(180, 148, 64, 0.1)', borderTop: '1px solid rgba(160, 130, 80, 0.15)' }}>
          <div className="toolbar-group">
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#5a4030', marginRight: '8px' }}>Table:</span>
            <ToolbarButton icon="+Row" title="Add Row Below" onClick={() => editor.chain().focus().addRowAfter().run()} />
            <ToolbarButton icon="-Row" title="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()} />
            <ToolbarButton icon="+Col" title="Add Column After" onClick={() => editor.chain().focus().addColumnAfter().run()} />
            <ToolbarButton icon="-Col" title="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()} />
            <div className="toolbar-divider" />
            <ToolbarButton icon="Merge" title="Merge/Split Cells" onClick={() => editor.chain().focus().mergeOrSplit().run()} />
            <div className="toolbar-divider" />
            <ToolbarButton icon="Del Table" title="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Toolbar Button ────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: string
  title: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  className?: string
}

function ToolbarButton({
  icon,
  title,
  active,
  disabled,
  onClick,
  className,
}: ToolbarButtonProps): React.JSX.Element {
  return (
    <button
      className={`toolbar-btn ${active ? 'toolbar-btn--active' : ''} ${className || ''}`}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault() // Prevent stealing focus from editor
        onClick()
      }}
    >
      {icon}
    </button>
  )
}
