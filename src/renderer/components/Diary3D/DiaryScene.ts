import * as THREE from 'three'
import { DiaryBook, BOOK } from './DiaryBook'
import { createLightingRig, type LightingRig } from './LightingRig'
import { CameraController, CAMERA_PRESETS } from './CameraController'

// ─── Easing ──────────────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ─── Diary State ─────────────────────────────────────────────
export type DiaryVisualState = 'closed' | 'opening' | 'open' | 'closing'

export interface DiarySceneCallbacks {
  onBookClicked?: () => void
  onOpenComplete?: () => void
  onCloseComplete?: () => void
}

/**
 * Main Three.js scene orchestrator for the diary.
 * Manages the render loop, interactions, and animations.
 */
export class DiaryScene {
  // ── Three.js core ─────────────────────────────────────────
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private cameraController: CameraController

  // ── Components ────────────────────────────────────────────
  private book: DiaryBook
  private lighting: LightingRig

  // ── State ─────────────────────────────────────────────────
  private visualState: DiaryVisualState = 'closed'
  private animationProgress = 0
  private animationDuration = 1500 // ms

  // Book group position: shifts from closed offset to centered-open
  private closedBookX = -BOOK.COVER_W / 2 + BOOK.SPINE_W / 2  // spine near center
  private openBookX = 0                                         // spine at center
  private clock = new THREE.Clock()
  private animFrameId: number | null = null
  private isDisposed = false
  public bgMaterial: THREE.ShaderMaterial | null = null

  // ── Interaction ───────────────────────────────────────────
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private callbacks: DiarySceneCallbacks = {}
  private container: HTMLElement | null = null

  // ── Hover & Drag Interaction ──────────────────────────────
  private isHovering = false
  private hoverGlow = 0
  private isPointerDown = false
  private isDragging = false
  private pointerDownClient = new THREE.Vector2()
  private targetInteractRot = new THREE.Vector2(0, 0) // pitch (x), yaw (y)
  private currentInteractRot = new THREE.Vector2(0, 0)
  private baseRotation = new THREE.Euler(0, 0, 0)

  constructor() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = null // Explicitly null to allow HTML background

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Enable transparency for HTML background
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25 // Slightly increased exposure for better visibility in shadows
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // Camera
    this.cameraController = new CameraController(1)

    // Lighting
    this.lighting = createLightingRig(this.scene)

    // Book
    this.book = new DiaryBook()
    // Initial closed offset so book appears centered when cover is on right
    this.book.group.position.x = this.closedBookX
    this.scene.add(this.book.group)
    
    ;(window as any).diaryScene = this
  }

  // ═══════════════════════════════════════════════════════════
  //  BACKGROUND TEXTURE
  // ═══════════════════════════════════════════════════════════

  public setBackground(sharpUrl: string, blurredUrl: string) {
    const geometry = new THREE.PlaneGeometry(2, 2)
    
    this.bgMaterial = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uSharpTexture: { value: null },
        uBlurredTexture: { value: null },
        uBlurProgress: { value: 0.0 },
        uImageAspect: { value: 1.0 },
        uScreenAspect: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uSharpTexture;
        uniform sampler2D uBlurredTexture;
        uniform float uBlurProgress;
        uniform float uImageAspect;
        uniform float uScreenAspect;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          float scaleX = 1.0;
          float scaleY = 1.0;
          
          if (uScreenAspect > uImageAspect) {
            scaleY = uImageAspect / uScreenAspect;
          } else {
            scaleX = uScreenAspect / uImageAspect;
          }
          
          uv.x = (uv.x - 0.5) * scaleX + 0.5;
          uv.y = (uv.y - 0.5) * scaleY + 0.5;
          
          vec4 sharp = texture2D(uSharpTexture, uv);
          vec4 blurred = texture2D(uBlurredTexture, uv);
          
          gl_FragColor = mix(sharp, blurred, uBlurProgress);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    })

    const bgMesh = new THREE.Mesh(geometry, this.bgMaterial)
    bgMesh.renderOrder = -100 // Render completely behind everything
    bgMesh.frustumCulled = false
    this.scene.add(bgMesh)

    const loader = new THREE.TextureLoader()
    
    loader.load(sharpUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      if (this.bgMaterial) {
        this.bgMaterial.uniforms.uSharpTexture.value = texture
        this.bgMaterial.uniforms.uImageAspect.value = texture.image.width / texture.image.height
      }
      this.updateBackgroundMapping()
    })

    loader.load(blurredUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      if (this.bgMaterial) {
        this.bgMaterial.uniforms.uBlurredTexture.value = texture
      }
    })
  }

  private generateProceduralEnvironment() {
    const envScene = new THREE.Scene()
    // Generally dark cinematic surroundings
    envScene.background = new THREE.Color(0x0a0503)

    // Warm amber/orange illumination above/front
    const topGeo = new THREE.PlaneGeometry(10, 10)
    const topMat = new THREE.MeshBasicMaterial({ color: 0xff8c44 })
    const topLight = new THREE.Mesh(topGeo, topMat)
    topLight.position.set(2, 6, 4)
    topLight.lookAt(0, 0, 0)
    envScene.add(topLight)

    // Darker mahogany/brown environment below
    const floorGeo = new THREE.PlaneGeometry(20, 20)
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x2a1005 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.5
    envScene.add(floor)

    // Subtle cool blue illumination from the rear/sides (moonlight)
    const moonGeo = new THREE.PlaneGeometry(8, 8)
    const moonMat = new THREE.MeshBasicMaterial({ color: 0x2a4b6d })
    const moonLight = new THREE.Mesh(moonGeo, moonMat)
    moonLight.position.set(-6, 3, -5)
    moonLight.lookAt(0, 0, 0)
    envScene.add(moonLight)

    // Restrained candle-like warm areas
    const candleGeo = new THREE.SphereGeometry(0.8, 16, 16)
    const candleMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 })
    const candle = new THREE.Mesh(candleGeo, candleMat)
    candle.position.set(4, 0, 1)
    envScene.add(candle)

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    pmremGenerator.compileCubemapShader()
    
    const envMap = pmremGenerator.fromScene(envScene).texture
    this.scene.environment = envMap
    
    pmremGenerator.dispose()
    
    // Dispose temporary geometry and materials
    topGeo.dispose()
    topMat.dispose()
    floorGeo.dispose()
    floorMat.dispose()
    moonGeo.dispose()
    moonMat.dispose()
    candleGeo.dispose()
    candleMat.dispose()
  }

  private updateBackgroundMapping() {
    if (!this.bgMaterial || !this.container) return
    const { width, height } = this.container.getBoundingClientRect()
    this.bgMaterial.uniforms.uScreenAspect.value = width / height
  }

  // ═══════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════════════════════

  /**
   * Mount the scene into a DOM container.
   */
  mount(container: HTMLElement, callbacks: DiarySceneCallbacks = {}): void {
    this.container = container
    this.callbacks = callbacks

    const { width, height } = container.getBoundingClientRect()
    this.renderer.setSize(width, height)
    this.cameraController.resize(width / height)
    container.appendChild(this.renderer.domElement)

    // Procedural environment for reflections
    this.generateProceduralEnvironment()

    // Event listeners
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.addEventListener('pointercancel', this.handlePointerUp)
    this.renderer.domElement.style.touchAction = 'none' // Prevent default drag/scroll
    this.renderer.domElement.style.cursor = 'default'
    window.addEventListener('resize', this.handleResize)

    // Start render loop
    this.clock.start()
    this.animate()
  }

  /**
   * Clean up everything.
   */
  dispose(): void {
    this.isDisposed = true
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
    }

    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp)
    this.renderer.domElement.removeEventListener('pointercancel', this.handlePointerUp)
    window.removeEventListener('resize', this.handleResize)

    this.book.dispose()
    this.renderer.dispose()
    this.scene.clear()

    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER LOOP
  // ═══════════════════════════════════════════════════════════

  private animate = (): void => {
    if (this.isDisposed) return
    this.animFrameId = requestAnimationFrame(this.animate)

    const deltaMs = this.clock.getDelta() * 1000

    // Update camera
    this.cameraController.update(deltaMs)

    // Update opening/closing animation
    this.updateBookAnimation(deltaMs)

    // Update hover glow
    this.updateHoverEffect(deltaMs)

    // Update drag interaction
    this.updateDragInteraction(deltaMs)

    // Update lighting (candle flicker)
    this.updateLighting(deltaMs)

    // Render
    this.renderer.render(this.scene, this.cameraController.camera)
  }

  // ═══════════════════════════════════════════════════════════
  //  LIGHTING
  // ═══════════════════════════════════════════════════════════

  private updateLighting(deltaMs: number): void {
    // Subtle candle flicker
    const time = this.clock.getElapsedTime()
    const flicker = Math.sin(time * 8) * Math.sin(time * 5.3) * 0.05
    this.lighting.candleLight.intensity = 0.35 + flicker
  }

  // ═══════════════════════════════════════════════════════════
  //  BOOK ANIMATION
  // ═══════════════════════════════════════════════════════════

  private updateBookAnimation(deltaMs: number): void {
    if (this.visualState === 'opening') {
      this.animationProgress += deltaMs / this.animationDuration
      if (this.animationProgress >= 1) {
        this.animationProgress = 1
        this.visualState = 'open'
        this.callbacks.onOpenComplete?.()
      }
      const t = easeInOutCubic(this.animationProgress)
      this.book.setOpenProgress(t)
      // Slide book group from closed offset to centered
      this.book.group.position.x = this.closedBookX + (this.openBookX - this.closedBookX) * t
      // Apply depth-of-field blur to background natively in WebGL custom shader
      if (this.bgMaterial) {
        this.bgMaterial.uniforms.uBlurProgress.value = t * 0.6
      }
    } else if (this.visualState === 'closing') {
      this.animationProgress -= deltaMs / this.animationDuration
      if (this.animationProgress <= 0) {
        this.animationProgress = 0
        this.visualState = 'closed'
        this.callbacks.onCloseComplete?.()
      }
      const t = easeInOutCubic(this.animationProgress)
      this.book.setOpenProgress(t)
      this.book.group.position.x = this.closedBookX + (this.openBookX - this.closedBookX) * t
      if (this.bgMaterial) {
        this.bgMaterial.uniforms.uBlurProgress.value = t * 0.6
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  HOVER EFFECT
  // ═══════════════════════════════════════════════════════════

  private updateHoverEffect(deltaMs: number): void {
    if (this.visualState !== 'closed') return

    const targetGlow = this.isHovering ? 1 : 0
    const speed = deltaMs * 0.004
    this.hoverGlow += (targetGlow - this.hoverGlow) * speed

    // Subtle golden emission on hover
    const emissiveIntensity = this.hoverGlow * 0.15
    if (this.book.materials.gold.emissiveIntensity !== undefined) {
      this.book.materials.gold.emissiveIntensity = 0.08 + emissiveIntensity
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  INTERACTIONS
  // ═══════════════════════════════════════════════════════════

  private handlePointerDown = (event: PointerEvent): void => {
    // Only left click
    if (event.button !== 0) return
    if (this.visualState !== 'closed') return

    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.cameraController.camera)
    const targets = this.book.getClickTargets()
    const intersects = this.raycaster.intersectObjects(targets, true)

    if (intersects.length > 0) {
      this.isPointerDown = true
      this.isDragging = false
      this.pointerDownClient.set(event.clientX, event.clientY)
      // Capture base rotation offset so drag is relative
      this.baseRotation.copy(this.book.group.rotation)
      this.renderer.domElement.setPointerCapture(event.pointerId)
    }
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.visualState !== 'closed') {
      this.resetDragState()
      return
    }

    if (this.isPointerDown) {
      // Dragging logic
      const dx = event.clientX - this.pointerDownClient.x
      const dy = event.clientY - this.pointerDownClient.y
      
      // Check drag threshold
      if (!this.isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        this.isDragging = true
      }

      if (this.isDragging) {
        // Map delta to rotation offsets
        const dragScale = 0.003
        
        let yawOffset = dx * dragScale
        let pitchOffset = dy * dragScale

        // Limits: ±30° yaw, ±15° pitch
        const maxYaw = 30 * (Math.PI / 180)
        const maxPitch = 15 * (Math.PI / 180)

        yawOffset = THREE.MathUtils.clamp(yawOffset, -maxYaw, maxYaw)
        pitchOffset = THREE.MathUtils.clamp(pitchOffset, -maxPitch, maxPitch)

        this.targetInteractRot.set(pitchOffset, yawOffset)
      }
    } else {
      // Normal hover logic
      this.updateMouse(event)
      this.raycaster.setFromCamera(this.mouse, this.cameraController.camera)
      const targets = this.book.getClickTargets()
      const intersects = this.raycaster.intersectObjects(targets, true)

      const wasHovering = this.isHovering
      this.isHovering = intersects.length > 0

      if (this.isHovering !== wasHovering) {
        this.renderer.domElement.style.cursor = this.isHovering ? 'pointer' : 'default'
      }
    }
  }

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.isPointerDown) {
      if (!this.isDragging && this.visualState === 'closed') {
        // Trigger click if threshold wasn't met
        this.callbacks.onBookClicked?.()
      }
      this.resetDragState()
      this.renderer.domElement.releasePointerCapture(event.pointerId)
    }
  }

  private resetDragState() {
    this.isPointerDown = false
    this.isDragging = false
    this.targetInteractRot.set(0, 0)
    
    if (this.visualState !== 'closed') {
      if (this.isHovering) {
        this.isHovering = false
        this.renderer.domElement.style.cursor = 'default'
      }
    }
  }

  private updateDragInteraction(deltaMs: number): void {
    // Smooth exponential decay lerp towards target
    const lerpFactor = 1.0 - Math.exp(-deltaMs * 0.008)
    this.currentInteractRot.lerp(this.targetInteractRot, lerpFactor)

    // Apply the rotation relative to the base state (typically 0,0,0)
    this.book.group.rotation.x = this.baseRotation.x + this.currentInteractRot.x
    this.book.group.rotation.y = this.baseRotation.y + this.currentInteractRot.y
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private handleResize = (): void => {
    if (!this.container) return
    const { width, height } = this.container.getBoundingClientRect()
    this.renderer.setSize(width, height)
    this.cameraController.resize(width / height)
    this.updateBackgroundMapping()
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════

  /**
   * Trigger the diary opening animation.
   */
  openBook(): void {
    if (this.visualState !== 'closed') return
    this.visualState = 'opening'
    this.animationProgress = 0
    this.cameraController.transitionTo(CAMERA_PRESETS.open, this.animationDuration)
    this.cameraController.setIdleEnabled(false)
  }

  /**
   * Trigger the diary closing animation.
   */
  closeBook(): void {
    if (this.visualState !== 'open') return
    this.visualState = 'closing'
    this.animationProgress = 1
    this.cameraController.transitionTo(CAMERA_PRESETS.closed, this.animationDuration)
    this.cameraController.setIdleEnabled(true)
  }

  getVisualState(): DiaryVisualState {
    return this.visualState
  }

  /**
   * Force a specific open progress (for testing).
   */
  setOpenProgressDirect(t: number): void {
    this.book.setOpenProgress(t)
    this.animationProgress = t
    if (t >= 1) {
      this.visualState = 'open'
    } else if (t <= 0) {
      this.visualState = 'closed'
    }
  }
}
