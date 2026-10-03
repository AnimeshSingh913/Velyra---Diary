import React, { useRef, useEffect } from 'react'
import { DiaryScene } from './DiaryScene'
import bgImage from '../../assets/moonlit_enchanted_study.png'
import bgImageBlurred from '../../assets/moonlit_enchanted_study_blurred.png'


interface DiarySceneReactProps {
  onBookClicked?: () => void
  onOpenComplete?: () => void
  onCloseComplete?: () => void
  sceneRef?: React.MutableRefObject<DiaryScene | null>
}

/**
 * React wrapper for the Three.js diary scene.
 * Uses refs for callbacks to avoid re-creating the scene on parent re-renders.
 */
export function DiarySceneReact({
  onBookClicked,
  onOpenComplete,
  onCloseComplete,
  sceneRef,
}: DiarySceneReactProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneInstanceRef = useRef<DiaryScene | null>(null)

  // Store callbacks in refs so the effect doesn't depend on them
  const callbacksRef = useRef({
    onBookClicked,
    onOpenComplete,
    onCloseComplete,
  })

  // Keep refs up-to-date without triggering the effect
  useEffect(() => {
    callbacksRef.current = {
      onBookClicked,
      onOpenComplete,
      onCloseComplete,
    }
  })

  // Mount scene only once (no callback dependencies)
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new DiaryScene()
    sceneInstanceRef.current = scene

    if (sceneRef) {
      sceneRef.current = scene
    }

    scene.mount(containerRef.current, {
      onBookClicked: () => callbacksRef.current.onBookClicked?.(),
      onOpenComplete: () => callbacksRef.current.onOpenComplete?.(),
      onCloseComplete: () => callbacksRef.current.onCloseComplete?.(),
    })

    // Load and set the WebGL background texture
    scene.setBackground(bgImage, bgImageBlurred)

    return () => {
      scene.dispose()
      sceneInstanceRef.current = null
      if (sceneRef) {
        sceneRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps — mount once, never recreate

  return (
    <div
      className="diary-scene-root"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="diary-scene-container"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
        }}
      />
    </div>
  )
}
