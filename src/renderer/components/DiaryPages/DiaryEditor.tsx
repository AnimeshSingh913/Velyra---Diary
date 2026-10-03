import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { FontSize } from './extensions/FontSize'
import { ResizableImage } from './extensions/ResizableImage'
import { ResizableVideo } from './extensions/ResizableVideo'
import { EditorToolbar } from './EditorToolbar'

interface DiaryEditorProps {
  /** The page ID being edited */
  pageId: string
  /** The entry ID being edited (for media imports) */
  entryId: string
  /** Initial HTML content loaded from DB */
  initialContent: string
  /** Called when content changes (for autosave) */
  onContentChange: (html: string) => void
  /** Called to signal immediate save */
  onSave: () => void
  /** Current save status */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

/**
 * Tiptap-based rich text editor embedded in the focused page view.
 * Styled to match the warm ivory diary aesthetic.
 */
export function DiaryEditor({
  pageId,
  entryId,
  initialContent,
  onContentChange,
  onSave,
  saveStatus,
}: DiaryEditorProps): React.JSX.Element {
  const [isReady, setIsReady] = useState(false)
  const contentChangeRef = useRef(onContentChange)
  contentChangeRef.current = onContentChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
        blockquote: {},
        bulletList: {},
        orderedList: {},
        history: { depth: 100 },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      Placeholder.configure({
        placeholder: 'Begin writing your thoughts…',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ResizableImage,
      ResizableVideo,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'diary-editor-content',
      },
    },
    onUpdate: ({ editor: ed }) => {
      contentChangeRef.current(ed.getHTML())
    },
    onCreate: () => {
      setIsReady(true)
    },
  })

  // Re-set content when pageId changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(initialContent || '')
    }
  // We only want to re-set when the page changes, not when content is typed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, editor])

  // Save on Ctrl+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  const handleImportImage = useCallback(async () => {
    if (!editor) return
    const res = await window.diaryAPI.media.importImage(pageId, entryId)
    if (res.success && res.media) {
      const src = await window.diaryAPI.media.getPath(res.media.id)
      if (src) {
        editor.chain().focus().insertContent({
          type: 'resizableImage',
          attrs: { src, mediaId: res.media.id, width: '50%' }
        }).run()
      }
    }
  }, [editor, pageId, entryId])

  const handleImportVideo = useCallback(async () => {
    if (!editor) return
    const res = await window.diaryAPI.media.importVideo(pageId, entryId)
    if (res.success && res.media) {
      const src = await window.diaryAPI.media.getPath(res.media.id)
      if (src) {
        editor.chain().focus().insertContent({
          type: 'resizableVideo',
          attrs: { src, mediaId: res.media.id, width: '50%' }
        }).run()
      }
    }
  }, [editor, pageId, entryId])

  // Save on blur
  const handleBlur = useCallback(() => {
    onSave()
  }, [onSave])

  if (!editor) return <div className="diary-editor-loading">Loading editor…</div>

  return (
    <div className="diary-editor">
      {/* Toolbar */}
      <EditorToolbar 
        editor={editor} 
        onInsertImage={handleImportImage}
        onInsertVideo={handleImportVideo}
      />

      {/* Editor area */}
      <div className="diary-editor-area" onBlur={handleBlur}>
        <EditorContent editor={editor} />
      </div>

      {/* Save status */}
      <div className={`diary-editor-status diary-editor-status--${saveStatus}`}>
        {saveStatus === 'saving' && (
          <><span className="status-dot status-dot--saving" /> Saving…</>
        )}
        {saveStatus === 'saved' && (
          <><span className="status-dot status-dot--saved" /> Saved</>
        )}
        {saveStatus === 'error' && (
          <><span className="status-dot status-dot--error" /> Save failed</>
        )}
      </div>
    </div>
  )
}
