import * as THREE from 'three'
import { createBookMaterials, type BookMaterials } from './BookMaterials'
import { createCoverOrnaments } from './CoverOrnaments'

// ─── Book Dimensions ─────────────────────────────────────────
export const BOOK = {
  COVER_W: 3.0,
  COVER_H: 3.6,
  COVER_T: 0.06,
  PAGE_W: 2.85,
  PAGE_H: 3.45,
  PAGE_BLOCK_T: 0.4,
  get SPINE_T() { return this.PAGE_BLOCK_T + this.COVER_T * 2 },
  SPINE_W: 0.18,
} as const

/**
 * The complete 3D diary book model.
 * Handles closed state, open animation, and page management.
 *
 * Coordinate convention (book lying flat):
 *   Spine runs along Z at x=0.
 *   Covers/pages extend in +X (closed) or ±X (open).
 *   Y is up (thickness direction).
 */
export class DiaryBook {
  readonly group: THREE.Group
  readonly materials: BookMaterials

  // ── Major components ───────────────────────────────────────
  backCover!: THREE.Mesh
  frontCoverPivot!: THREE.Group
  frontCoverMesh!: THREE.Mesh
  spine!: THREE.Mesh
  spineRidges!: THREE.Group
  pageBlock!: THREE.Mesh          // right-side page block
  leftPageBlock!: THREE.Mesh      // appears when open
  ornaments!: THREE.Group
  tableSurface!: THREE.Mesh
  ribbon!: THREE.Mesh

  // ── State ──────────────────────────────────────────────────
  private _openProgress = 0

  constructor() {
    this.group = new THREE.Group()
    this.materials = createBookMaterials()
    this.build()
  }

  // ═══════════════════════════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════════════════════════

  private build(): void {
    const { COVER_W, COVER_H, COVER_T, PAGE_W, PAGE_H, PAGE_BLOCK_T, SPINE_W } = BOOK
    const totalH = COVER_T * 2 + PAGE_BLOCK_T  // total book thickness

    // ── Table surface ────────────────────────────────────────
    const tableGeo = new THREE.PlaneGeometry(24, 24)
    const tableMat = new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: 0.45,
    })
    this.tableSurface = new THREE.Mesh(tableGeo, tableMat)
    this.tableSurface.rotation.x = -Math.PI / 2
    this.tableSurface.position.y = -0.01
    this.tableSurface.receiveShadow = true
    this.group.add(this.tableSurface)

    // ── Cover Geometry Helper ────────────────────────────────
    const createCoverGeo = () => {
      const shape = new THREE.Shape()
      const w = COVER_W, h = COVER_H, r = 0.05
      shape.moveTo(0, r)
      // Slight outward bow on the long edge
      shape.quadraticCurveTo(0, h / 2, 0, h - r)
      shape.quadraticCurveTo(0, h, r, h)
      // Slight outward bow on the top edge
      shape.quadraticCurveTo(w / 2, h + 0.02, w - r, h)
      shape.quadraticCurveTo(w, h, w, h - r)
      // Fore-edge bow
      shape.quadraticCurveTo(w + 0.01, h / 2, w, r)
      shape.quadraticCurveTo(w, 0, w - r, 0)
      // Bottom edge bow
      shape.quadraticCurveTo(w / 2, -0.02, r, 0)
      shape.quadraticCurveTo(0, 0, 0, r)
      
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: COVER_T - 0.01,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.025,
        bevelThickness: 0.025,
      })
      geo.center()
      geo.rotateX(Math.PI / 2)
      return geo
    }

    const coverGeo = createCoverGeo()

    // ── Page Block Geometry Helper ───────────────────────────
    const createPageBlockGeo = () => {
      const geo = new THREE.BoxGeometry(PAGE_W, PAGE_BLOCK_T, PAGE_H, 32, 1, 32)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        
        // Curve near spine (gutter)
        // x goes from -PAGE_W/2 to PAGE_W/2
        const normalizedX = (x + PAGE_W / 2) / PAGE_W
        let newY = y
        
        // Create the classic book page curve: drops near spine, swells in middle, tapers at edge
        if (normalizedX < 0.2) {
          // Gutter dip
          const dip = Math.sin((0.2 - normalizedX) * Math.PI * 2.5) * 0.04
          newY -= dip * Math.sign(y)
        } else {
          // Fore-edge swell
          const swell = Math.sin((normalizedX - 0.2) * Math.PI * 1.25) * 0.02
          newY += swell * Math.sign(y)
        }

        // Add subtle ripples to the outer edges to simulate stacked paper
        let newX = x
        let newZ = z
        if (x > PAGE_W * 0.3) {
          newX += (Math.sin(y * 120) * Math.sin(z * 20)) * 0.005
        }
        if (Math.abs(z) > PAGE_H * 0.4) {
          newZ += (Math.sin(y * 100) * Math.sin(x * 15)) * 0.005
        }
        
        pos.setXYZ(i, newX, newY, newZ)
      }
      geo.computeVertexNormals()
      return geo
    }

    const pageBlockGeo = createPageBlockGeo()

    // ── Back Cover ───────────────────────────────────────────
    this.backCover = new THREE.Mesh(coverGeo, this.materials.cover)
    this.backCover.position.set(COVER_W / 2, COVER_T / 2, 0)
    this.backCover.castShadow = true
    this.backCover.receiveShadow = true
    this.group.add(this.backCover)

    // ── Right Page Block (pages on the back-cover side) ──────
    const pageBlockMats = [
      this.materials.pageEdge, // +X right edge
      this.materials.pageEdge, // -X spine edge
      this.materials.page,     // +Y top surface (writable)
      this.materials.page,     // -Y bottom
      this.materials.pageEdge, // +Z front edge
      this.materials.pageEdge, // -Z back edge
    ]
    this.pageBlock = new THREE.Mesh(pageBlockGeo, pageBlockMats)
    this.pageBlock.position.set(PAGE_W / 2, COVER_T + PAGE_BLOCK_T / 2, 0)
    this.pageBlock.castShadow = true
    this.pageBlock.receiveShadow = true
    this.group.add(this.pageBlock)

    // ── Left Page Block (hidden initially, revealed when open) ─
    const leftPageMats = pageBlockMats.map(m => m.clone())
    this.leftPageBlock = new THREE.Mesh(pageBlockGeo, leftPageMats)
    this.leftPageBlock.scale.x = -1 // Mirror so gutter curve is at the spine
    this.leftPageBlock.visible = false
    this.leftPageBlock.castShadow = true
    this.leftPageBlock.receiveShadow = true
    this.group.add(this.leftPageBlock)

    // ── Spine ────────────────────────────────────────────────
    this.spine = new THREE.Mesh(
      new THREE.BoxGeometry(SPINE_W, totalH, COVER_H),
      this.materials.spine
    )
    this.spine.position.set(-SPINE_W / 2, totalH / 2, 0)
    this.spine.castShadow = true
    this.group.add(this.spine)

    // ── Spine Ridges ─────────────────────────────────────────
    this.spineRidges = new THREE.Group()
    const ridgeCount = 5
    const ridgeSpacing = COVER_H / (ridgeCount + 1)
    
    // Create a rounded half-cylinder shape for ridges
    const ridgeGeo = new THREE.CylinderGeometry(0.04, 0.04, SPINE_W + 0.04, 16, 1, false, 0, Math.PI)
    ridgeGeo.rotateZ(Math.PI / 2) // Lay flat across the spine

    for (let i = 1; i <= ridgeCount; i++) {
      const ridge = new THREE.Mesh(ridgeGeo, this.materials.spine)
      ridge.position.set(
        -SPINE_W / 2 - 0.01,
        totalH / 2,
        -COVER_H / 2 + i * ridgeSpacing
      )
      ridge.rotation.y = -Math.PI / 2 // Align with spine curve
      ridge.castShadow = true
      this.spineRidges.add(ridge)
    }
    this.group.add(this.spineRidges)

    // ── Front Cover (in pivot group for rotation) ────────────
    this.frontCoverPivot = new THREE.Group()
    // Pivot sits at the spine edge, at the very top of the book
    this.frontCoverPivot.position.set(0, COVER_T + PAGE_BLOCK_T, 0)

    this.frontCoverMesh = new THREE.Mesh(coverGeo, this.materials.cover)
    // Position so left edge of cover is at the pivot (spine edge)
    this.frontCoverMesh.position.set(COVER_W / 2, COVER_T / 2, 0)
    this.frontCoverMesh.castShadow = true
    this.frontCoverMesh.receiveShadow = true

    // ── Cover Ornaments ──────────────────────────────────────
    this.ornaments = createCoverOrnaments(this.materials.gold, COVER_W, COVER_H)
    this.ornaments.position.set(0, COVER_T / 2 + 0.001, 0)
    this.frontCoverMesh.add(this.ornaments)

    this.frontCoverPivot.add(this.frontCoverMesh)
    this.group.add(this.frontCoverPivot)

    // ── Ribbon Bookmark ──────────────────────────────────────
    // A simple curved ribbon using ExtrudeGeometry for thickness and curve
    const ribbonCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, -0.05, COVER_H * 0.6),
      new THREE.Vector3(0.15, -0.1, COVER_H * 1.1)
    )
    const ribbonShape = new THREE.Shape()
    ribbonShape.moveTo(-0.04, 0)
    ribbonShape.lineTo(0.04, 0)
    ribbonShape.lineTo(0.04, 0.005)
    ribbonShape.lineTo(-0.04, 0.005)
    ribbonShape.closePath()
    
    const ribbonGeo = new THREE.ExtrudeGeometry(ribbonShape, {
      extrudePath: ribbonCurve,
      steps: 20,
      bevelEnabled: false
    })
    
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x5a111b, // Dark velvet red
      roughness: 0.6,
      metalness: 0.1,
    })
    this.ribbon = new THREE.Mesh(ribbonGeo, ribbonMat)
    this.ribbon.position.set(PAGE_W / 2, COVER_T + PAGE_BLOCK_T, -COVER_H / 2)
    this.ribbon.castShadow = true
    this.group.add(this.ribbon)
  }

  // ═══════════════════════════════════════════════════════════
  //  OPEN / CLOSE ANIMATION
  // ═══════════════════════════════════════════════════════════

  get openProgress(): number {
    return this._openProgress
  }

  /**
   * Update the book's visual state based on open progress.
   * @param t  0 = fully closed, 1 = fully open
   *
   * When fully open the front cover lies flat on the LEFT side (−X)
   * while the back cover stays on the RIGHT side (+X).
   * Both page blocks (left & right) each have half the total thickness.
   */
  setOpenProgress(t: number): void {
    this._openProgress = Math.max(0, Math.min(1, t))
    const { COVER_T, PAGE_BLOCK_T, PAGE_W } = BOOK

    // ── Front cover rotation ─────────────────────────────────
    // 0 → cover flat on top;  −π → cover flat on the left
    this.frontCoverPivot.rotation.z = -Math.PI * t

    // ── Front cover pivot Y ──────────────────────────────────
    // Closed: hinge at y = COVER_T + PAGE_BLOCK_T  (top of page block)
    // Open:   hinge at y = COVER_T                  (top of back cover)
    // Linear interpolation gives correct landing position.
    this.frontCoverPivot.position.y = COVER_T + PAGE_BLOCK_T * (1 - t)

    // ── Right page block (always visible, thins to half) ─────
    const rightScale = 1 - t * 0.5          // 1 → 0.5
    this.pageBlock.scale.y = rightScale
    this.pageBlock.position.y = COVER_T + (PAGE_BLOCK_T * rightScale) / 2

    // ── Left page block (appears, grows to half) ─────────────
    if (t > 0.08) {
      this.leftPageBlock.visible = true
      const raw = (t - 0.08) / 0.92         // 0 → 1
      const leftScale = raw * 0.5           // 0 → 0.5
      this.leftPageBlock.scale.y = Math.max(0.001, leftScale)
      this.leftPageBlock.position.set(
        -PAGE_W / 2,
        COVER_T + (PAGE_BLOCK_T * leftScale) / 2,
        0
      )
    } else {
      this.leftPageBlock.visible = false
    }

    // ── Spine adjusts to open height ─────────────────────────
    const closedSpineH = COVER_T * 2 + PAGE_BLOCK_T    // 0.52
    const openSpineH = COVER_T * 2 + PAGE_BLOCK_T * 0.5 // 0.32
    const spineH = closedSpineH + (openSpineH - closedSpineH) * t
    this.spine.scale.y = spineH / closedSpineH
    this.spine.position.y = spineH / 2

    // ── Ribbon hides as cover opens ──────────────────────────
    this.ribbon.visible = t < 0.3
    if (t < 0.3) {
      this.ribbon.position.y = COVER_T + PAGE_BLOCK_T * (1 - t) + 0.005
    }
  }

  /**
   * Get all meshes that should be tested for click interaction.
   */
  getClickTargets(): THREE.Object3D[] {
    return [this.frontCoverMesh, this.backCover, this.pageBlock]
  }

  /**
   * Dispose of all geometries and materials.
   */
  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }
}

