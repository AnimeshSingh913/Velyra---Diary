import React, { useRef, useState, useEffect } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

export function ResizableMediaNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected, extension } = props
  const { src, width, align, wrap, mediaId } = node.attrs
  const isVideo = extension.name === 'resizableVideo' || node.type.name === 'resizableVideo'
  
  // Use the opaque asset URL format, falling back to src if mediaId is missing
  let displaySrc = src
  if (mediaId) {
    displaySrc = `diary-media://asset/${mediaId}`
  }

  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidthStr = String(width).replace('%', '')
    const startWidth = parseFloat(startWidthStr) || 100
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current || !containerRef.current.parentElement) return
      const parentWidth = containerRef.current.parentElement.clientWidth
      const diffX = moveEvent.clientX - startX
      // If dragged from bottom-right, positive diff means wider
      const diffPct = (diffX / parentWidth) * 100
      let newWidth = startWidth + diffPct
      newWidth = Math.max(10, Math.min(newWidth, 100)) // Clamp 10% to 100%
      updateAttributes({ width: `${newWidth}%` })
    }

    const onMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Determine wrapper styles based on alignment and wrap
  let wrapperStyle: React.CSSProperties = {
    display: 'flex',
    margin: '1em 0',
  }
  
  if (wrap === 'wrap') {
    wrapperStyle.display = 'block'
    if (align === 'left') {
      wrapperStyle.float = 'left'
      wrapperStyle.margin = '0 1em 1em 0'
    } else if (align === 'right') {
      wrapperStyle.float = 'right'
      wrapperStyle.margin = '0 0 1em 1em'
    }
  } else {
    // block level
    if (align === 'center') {
      wrapperStyle.justifyContent = 'center'
    } else if (align === 'right') {
      wrapperStyle.justifyContent = 'flex-end'
    } else {
      wrapperStyle.justifyContent = 'flex-start'
    }
  }

  const setAlign = (a: string) => updateAttributes({ align: a, wrap: 'none' })
  const setWrap = (a: string) => updateAttributes({ align: a, wrap: 'wrap' })
  const setSize = (size: string) => updateAttributes({ width: size })

  return (
    <NodeViewWrapper style={wrapperStyle} className={`resizable-media-wrapper ${selected ? 'selected' : ''}`}>
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: typeof width === 'number' ? `${width}%` : (width.includes('%') ? width : '100%'),
          maxWidth: '100%',
        }}
      >
        {isVideo ? (
          <video 
            src={displaySrc} 
            controls 
            style={{ width: '100%', display: 'block', borderRadius: '4px' }}
          />
        ) : (
          <img 
            src={displaySrc} 
            alt="media" 
            style={{ width: '100%', display: 'block', borderRadius: '4px' }}
            draggable={false}
          />
        )}
        
        {selected && (
          <>
            {/* Outline highlight */}
            <div style={{
              position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
              border: '2px solid #5a1820', borderRadius: '6px', pointerEvents: 'none'
            }} />
            
            {/* Resize handle (bottom right) */}
            <div 
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute', bottom: -6, right: -6,
                width: 14, height: 14, backgroundColor: '#5a1820',
                borderRadius: '50%', cursor: 'se-resize',
                border: '2px solid white'
              }}
            />

            {/* Context Toolbar */}
            {!isResizing && (
              <div 
                className="media-context-toolbar"
                style={{
                  position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '2px', background: 'var(--bg-panel)', padding: '6px',
                  borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  zIndex: 10, whiteSpace: 'nowrap', border: '1px solid var(--border-subtle)',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '10px', padding: '0 4px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</span>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setSize('25%') }} title="Small">S</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setSize('50%') }} title="Medium">M</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setSize('75%') }} title="Large">L</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setSize('100%') }} title="Full">F</button>
                <span style={{ borderLeft: '1px solid var(--border-subtle)', margin: '0 4px', height: '16px' }} />
                
                <span style={{ fontSize: '10px', padding: '0 4px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Align</span>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setAlign('left') }} title="Block Left">◧</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setAlign('center') }} title="Block Center">▣</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setAlign('right') }} title="Block Right">◨</button>
                <span style={{ borderLeft: '1px solid var(--border-subtle)', margin: '0 4px', height: '16px' }} />
                
                <span style={{ fontSize: '10px', padding: '0 4px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wrap</span>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setWrap('left') }} title="Wrap Left">◧≡</button>
                <button className="toolbar-btn" onMouseDown={(e) => { e.preventDefault(); setWrap('right') }} title="Wrap Right">≡◨</button>
                <span style={{ borderLeft: '1px solid var(--border-subtle)', margin: '0 4px', height: '16px' }} />
                
                <button className="toolbar-btn" style={{ color: '#b43228' }} onMouseDown={(e) => { e.preventDefault(); props.deleteNode() }} title="Delete">✕</button>
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
