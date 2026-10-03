import * as THREE from 'three'

// ─── Easing Function ─────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ─── Camera Presets ──────────────────────────────────────────

export interface CameraPreset {
  position: THREE.Vector3
  target: THREE.Vector3
}

export const CAMERA_PRESETS = {
  closed: {
    position: new THREE.Vector3(0.3, 4.2, 5.0),
    target: new THREE.Vector3(0, 0.2, 0),
  },
  open: {
    position: new THREE.Vector3(0, 7.8, 2.5),
    target: new THREE.Vector3(0, 0.2, -0.3),
  },
} as const

// ─── Camera Controller ──────────────────────────────────────

export class CameraController {
  readonly camera: THREE.PerspectiveCamera
  private target: THREE.Vector3
  private isAnimating = false
  private animProgress = 0
  private animDuration = 1500
  private fromPos: THREE.Vector3 | null = null
  private toPos: THREE.Vector3 | null = null
  private fromTarget: THREE.Vector3 | null = null
  private toTarget: THREE.Vector3 | null = null

  // Subtle idle animation
  private idleTime = 0
  private idleEnabled = true

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
    this.camera.position.copy(CAMERA_PRESETS.closed.position)
    this.target = CAMERA_PRESETS.closed.target.clone()
    this.camera.lookAt(this.target)
  }

  /**
   * Smoothly transition to a camera preset.
   */
  transitionTo(preset: CameraPreset, duration = 1500): void {
    this.fromPos = this.camera.position.clone()
    this.toPos = preset.position.clone()
    this.fromTarget = this.target.clone()
    this.toTarget = preset.target.clone()
    this.animDuration = duration
    this.animProgress = 0
    this.isAnimating = true
  }

  /**
   * Called every frame.
   */
  update(deltaMs: number): void {
    // ── Transition animation ────────────────────────────────
    if (this.isAnimating && this.fromPos && this.toPos && this.fromTarget && this.toTarget) {
      this.animProgress += deltaMs / this.animDuration
      if (this.animProgress >= 1) {
        this.animProgress = 1
        this.isAnimating = false
      }
      const t = easeInOutCubic(this.animProgress)
      this.camera.position.lerpVectors(this.fromPos, this.toPos, t)
      this.target.lerpVectors(this.fromTarget, this.toTarget, t)
    }

    // ── Subtle idle breathing ───────────────────────────────
    if (this.idleEnabled && !this.isAnimating) {
      this.idleTime += deltaMs * 0.001
      const breatheY = Math.sin(this.idleTime * 0.5) * 0.03
      const breatheX = Math.cos(this.idleTime * 0.3) * 0.02
      this.camera.position.y += breatheY * 0.01
      this.camera.position.x += breatheX * 0.01
    }

    this.camera.lookAt(this.target)
  }

  /**
   * Handle window resize.
   */
  resize(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  setIdleEnabled(enabled: boolean): void {
    this.idleEnabled = enabled
  }
}
