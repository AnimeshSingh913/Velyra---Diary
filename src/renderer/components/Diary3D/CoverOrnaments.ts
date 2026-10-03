import * as THREE from 'three'

/**
 * Creates all gold decorative ornaments for the front cover.
 * HIGH VISIBILITY REFINEMENT: Thick, raised, highly physical antique brass.
 * Substantial filigree and fully integrated elegant design.
 */
export function createCoverOrnaments(
  goldMaterial: THREE.MeshStandardMaterial,
  coverW: number,
  coverH: number
): THREE.Group {
  const group = new THREE.Group()
  const depth = 0.055 // HIGHER RAISED physical embossing depth

  // Create an extremely faint glowing gold for the magic highlights
  const glowGold = goldMaterial.clone()
  glowGold.emissive = new THREE.Color(0xff8833)
  glowGold.emissiveIntensity = 0.05 // Barely there warm highlight

  // 1. SUBSTANTIAL ORNAMENTAL FRAME (Double Border + Rich Filigree)
  const frameGroup = createSubstantialFrame(goldMaterial, coverW, coverH, depth)
  group.add(frameGroup)

  // 2. CORNER FILIGREE CLUSTERS (Large, highly visible, elegant)
  const cornersGroup = createCornerFiligree(goldMaterial, glowGold, coverW, coverH, depth)
  group.add(cornersGroup)

  // 3. CENTRAL EMBLEM (Layered, thick bevels, no extreme glow)
  const emblem = createCentralEmblem(goldMaterial, glowGold, depth)
  group.add(emblem)

  // 4. VERTICAL CENTER MOTIF
  const verticalMotif = createVerticalMotif(goldMaterial, glowGold, coverW, coverH, depth)
  group.add(verticalMotif)

  // 5. INTENTIONAL CELESTIAL DETAILS
  const celestial = createIntentionalCelestial(goldMaterial, glowGold, coverW, coverH, depth)
  group.add(celestial)

  // 6. TINY MAGICAL LIGHTING (Barely there)
  const pointLight = new THREE.PointLight(0xffa544, 0.05, 4.0)
  pointLight.position.set(0, depth + 0.15, 0)
  group.add(pointLight)

  // ─── Clasp on right edge ──────────────────────────────────
  const claspGroup = createClasp(goldMaterial, depth)
  claspGroup.position.set(coverW / 2 - 0.03, 0, 0)
  group.add(claspGroup)

  return group
}

// ─── 1. SUBSTANTIAL FRAME ──────────────────────────────────────

function createSubstantialFrame(
  mat: THREE.MeshStandardMaterial,
  cw: number,
  ch: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  
  // Thick Outer Border
  const outInset = 0.15
  const ow = cw - outInset * 2
  const oh = ch - outInset * 2
  const outThick = 0.05 // Highly visible

  // Thin Inner Border
  const inInset = 0.35
  const iw = cw - inInset * 2
  const ih = ch - inInset * 2
  const inThick = 0.02 

  const buildRect = (w: number, h: number, t: number, d: number) => {
    const rg = new THREE.Group()
    const horizGeo = new THREE.BoxGeometry(w, d, t)
    const vertGeo = new THREE.BoxGeometry(t, d, h)
    
    // Add bevel-like smoothing by keeping geometry clean, material catches light well
    const top = new THREE.Mesh(horizGeo, mat)
    top.position.set(0, d / 2, h / 2)
    const bot = new THREE.Mesh(horizGeo, mat)
    bot.position.set(0, d / 2, -h / 2)
    const left = new THREE.Mesh(vertGeo, mat)
    left.position.set(-w / 2, d / 2, 0)
    const right = new THREE.Mesh(vertGeo, mat)
    right.position.set(w / 2, d / 2, 0)
    
    rg.add(top, bot, left, right)
    return rg
  }

  g.add(buildRect(ow, oh, outThick, depth))
  g.add(buildRect(iw, ih, inThick, depth * 0.7))

  // Mid-border scrolling filigree lines running along the edges
  const numScrolls = 7
  const sideH = (oh / 2) - 0.5
  for (const zSign of [1, -1]) {
    for (const xSign of [1, -1]) {
      for (let i = 1; i < numScrolls; i++) {
        const offset = (sideH * (i / numScrolls)) * zSign
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 12, 32, Math.PI), mat)
        arc.rotation.x = -Math.PI / 2
        arc.rotation.z = Math.PI / 2
        
        // Alternating flips for a running vine look
        if (i % 2 !== 0) arc.rotation.z = -Math.PI / 2
        
        arc.position.set(xSign * (ow / 2 - 0.1), depth * 0.8, offset)
        g.add(arc)
      }
    }
  }

  // Top/bottom edge scrolls
  const numTopScrolls = 4
  const sideW = (ow / 2) - 0.5
  for (const zSign of [1, -1]) {
    for (const xSign of [1, -1]) {
      for (let i = 1; i < numTopScrolls; i++) {
        const offset = (sideW * (i / numTopScrolls)) * xSign
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 12, 32, Math.PI), mat)
        arc.rotation.x = -Math.PI / 2
        
        if (i % 2 !== 0) arc.rotation.z = Math.PI
        
        arc.position.set(offset, depth * 0.8, zSign * (oh / 2 - 0.1))
        g.add(arc)
      }
    }
  }

  return g
}

// ─── 2. CORNER FILIGREE ────────────────────────────────────────

function createCornerFiligree(
  mat: THREE.MeshStandardMaterial,
  glowMat: THREE.MeshStandardMaterial,
  cw: number,
  ch: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  const inset = 0.15
  const ow = cw - inset * 2
  const oh = ch - inset * 2

  const corners: [number, number, number][] = [
    [-ow / 2, 0, oh / 2],
    [ow / 2, 0, oh / 2],
    [-ow / 2, 0, -oh / 2],
    [ow / 2, 0, -oh / 2],
  ]
  const rotations = [0, Math.PI / 2, -Math.PI / 2, Math.PI]

  corners.forEach(([cx, cy, cz], idx) => {
    const corner = new THREE.Group()
    
    // Huge thick sweeping arc defining the corner boundary
    const mainArc = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 16, 48, Math.PI / 2), mat)
    mainArc.rotation.x = -Math.PI / 2
    mainArc.position.set(0, depth * 0.8, 0)
    corner.add(mainArc)

    // Secondary inner arc
    const innerArc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 16, 48, Math.PI / 2), mat)
    innerArc.rotation.x = -Math.PI / 2
    innerArc.position.set(0.05, depth * 0.9, 0.05)
    corner.add(innerArc)

    // Inner curled vine
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 16, 48, Math.PI * 1.5), mat)
    curl.rotation.x = -Math.PI / 2
    curl.rotation.z = Math.PI / 4
    curl.position.set(0.15, depth * 1.0, 0.15)
    corner.add(curl)

    // Large leaf/diamond accents at the tips
    const leaf = createDiamond(mat, 0.08, depth * 1.5)
    leaf.position.set(0.22, 0, 0.22)
    leaf.rotation.y = Math.PI / 4
    corner.add(leaf)

    // Tiny glowing highlight pearl
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), glowMat)
    pearl.scale.y = 0.5
    pearl.position.set(0.12, depth * 1.2, 0.12)
    corner.add(pearl)

    corner.position.set(cx, cy, cz)
    corner.rotation.y = rotations[idx]
    g.add(corner)
  })

  return g
}

// ─── 3. CENTRAL EMBLEM ─────────────────────────────────────────

function createCentralEmblem(
  mat: THREE.MeshStandardMaterial,
  glowMat: THREE.MeshStandardMaterial,
  depth: number
): THREE.Group {
  const g = new THREE.Group()

  // Base plates with extreme thick bevels for physical light catching
  const diamondShape = new THREE.Shape()
  const dw = 0.45, dh = 0.75
  diamondShape.moveTo(0, dh)
  diamondShape.lineTo(dw, 0)
  diamondShape.lineTo(0, -dh)
  diamondShape.lineTo(-dw, 0)
  diamondShape.closePath()

  const diamondGeo = new THREE.ExtrudeGeometry(diamondShape, {
    depth: depth * 1.3,
    bevelEnabled: true,
    bevelSize: 0.035, // Enhanced bevel for strong highlights
    bevelThickness: 0.035
  })
  const diamond = new THREE.Mesh(diamondGeo, mat)
  diamond.rotation.x = -Math.PI / 2
  diamond.position.y = depth * 0.2 // Visually separate from background
  g.add(diamond)

  // Complex layered celestial seal
  const compassGeo = new THREE.ExtrudeGeometry(createStarShape(4, 0.38, 0.1), {
    depth: depth * 2.1,
    bevelEnabled: true,
    bevelSize: 0.02, // Enhanced bevel
    bevelThickness: 0.02
  })
  const compass = new THREE.Mesh(compassGeo, mat)
  compass.rotation.x = -Math.PI / 2
  compass.position.y = depth * 0.2
  g.add(compass)
  
  // Secondary offset compass
  const compassGeo2 = new THREE.ExtrudeGeometry(createStarShape(4, 0.28, 0.08), {
    depth: depth * 2.3,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015
  })
  const compass2 = new THREE.Mesh(compassGeo2, mat)
  compass2.rotation.x = -Math.PI / 2
  compass2.rotation.y = Math.PI / 4
  compass2.position.y = depth * 0.2
  g.add(compass2)

  // Thick concentric inner rings
  const innerRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 16, 48), mat)
  innerRing1.rotation.x = -Math.PI / 2
  innerRing1.position.y = depth * 2.6
  g.add(innerRing1)

  // Subtle core (barely glowing)
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 24), glowMat)
  core.scale.y = 0.4
  core.position.y = depth * 2.8
  g.add(core)

  // ─── Surrounding Detail ───
  const surrGroup = new THREE.Group()
  
  // Thick, substantial outer bounding oval
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.018, 16, 48, Math.PI / 2.2), mat)
    arc.rotation.x = -Math.PI / 2
    arc.scale.set(0.85, 1, 1.25) // Oval stretch
    arc.rotation.z = (i * Math.PI) / 2 + Math.PI / 12
    arc.position.y = depth * 0.8
    surrGroup.add(arc)
  }

  // Cardinal point huge diamonds on the outer oval
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const distX = 0.55, distZ = 0.8
    const px = Math.cos(angle) * distX
    const pz = Math.sin(angle) * distZ
    
    const gem = createDiamond(mat, 0.06, depth * 1.5)
    gem.position.set(px, 0, pz)
    gem.rotation.y = -angle
    surrGroup.add(gem)
  }

  g.add(surrGroup)
  return g
}

// ─── 4. VERTICAL CENTER MOTIF ──────────────────────────────────

function createVerticalMotif(
  mat: THREE.MeshStandardMaterial,
  glowMat: THREE.MeshStandardMaterial,
  cw: number,
  ch: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  const outInset = 0.15
  const ih = ch - outInset * 2

  const gap = 0.95 // Accommodate the larger central emblem
  const lineLen = (ih / 2) - gap

  for (const zSign of [1, -1]) {
    const cy = zSign * (gap + lineLen / 2)
    
    // Substantial structural vertical line
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, depth * 0.8, lineLen),
      mat
    )
    line.position.set(0, depth * 0.5, cy)
    g.add(line)

    // Large intermediate filigree knots
    const numKnots = 3
    for (let i = 1; i <= numKnots; i++) {
      const sepZ = zSign * (gap + (lineLen * (i / (numKnots + 1))))
      
      const knot = new THREE.Group()
      
      const dia = createDiamond(mat, 0.04, depth * 1.5)
      dia.position.set(0, 0, 0)
      knot.add(dia)

      const leftArc = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 12, 24, Math.PI), mat)
      leftArc.rotation.x = -Math.PI / 2
      leftArc.rotation.z = Math.PI / 2
      leftArc.position.set(-0.06, depth * 0.8, 0)
      
      const rightArc = leftArc.clone()
      rightArc.rotation.z = -Math.PI / 2
      rightArc.position.set(0.06, depth * 0.8, 0)
      
      knot.add(leftArc, rightArc)

      // Add one tiny glow accent in the middle knot
      if (i === 2) {
        const hLight = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), glowMat)
        hLight.position.set(0, depth * 1.6, 0)
        knot.add(hLight)
      }

      knot.position.set(0, 0, sepZ)
      g.add(knot)
    }
  }

  return g
}

// ─── 5. INTENTIONAL CELESTIAL DETAILS ──────────────────────────

function createIntentionalCelestial(
  mat: THREE.MeshStandardMaterial,
  glowMat: THREE.MeshStandardMaterial,
  cw: number,
  ch: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  
  // Create substantial celestial arcs that fill the mid-spaces
  const createCelestialArc = (xSign: number, zSign: number) => {
    const cg = new THREE.Group()
    
    const nodes = [
      new THREE.Vector3(0.55, 0, 1.05),
      new THREE.Vector3(0.75, 0, 1.45),
      new THREE.Vector3(1.05, 0, 1.55),
    ]
    
    // Large engraved stars at nodes
    nodes.forEach((pos, idx) => {
      const star = createFourPointStar(mat, 0.05, depth * 1.2)
      star.position.copy(pos)
      cg.add(star)

      // Extremely faint glow core on just the middle star
      if (idx === 1) {
        const sCore = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), glowMat)
        sCore.position.copy(pos)
        sCore.position.y = depth * 1.3
        cg.add(sCore)
      }
    })

    // Thick engraved connecting lines
    for (let i = 0; i < nodes.length - 1; i++) {
      const p1 = nodes[i]
      const p2 = nodes[i + 1]
      const dist = p1.distanceTo(p2)
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, dist, 12), mat)
      line.rotation.x = Math.PI / 2
      const dx = p2.x - p1.x
      const dz = p2.z - p1.z
      line.rotation.z = -Math.atan2(dz, dx)
      line.position.copy(p1).lerp(p2, 0.5)
      line.position.y = depth * 0.6
      cg.add(line)
    }

    // Large decorative crescent
    const moon = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 16, 32, Math.PI * 1.1),
      mat
    )
    moon.rotation.x = -Math.PI / 2
    moon.rotation.z = Math.PI / 1.5
    moon.position.set(0.9, depth * 0.8, 1.25)
    cg.add(moon)

    if (xSign === -1) cg.scale.x = -1
    if (zSign === -1) cg.scale.z = -1
    
    return cg
  }

  g.add(createCelestialArc(1, 1))
  g.add(createCelestialArc(-1, 1))
  g.add(createCelestialArc(1, -1))
  g.add(createCelestialArc(-1, -1))

  return g
}

// ─── HELPERS ───────────────────────────────────────────────────

function createStarShape(points: number, outerR: number, innerR: number): THREE.Shape {
  const shape = new THREE.Shape()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function createFourPointStar(mat: THREE.MeshStandardMaterial, size: number, depth: number): THREE.Group {
  const g = new THREE.Group()
  const geo = new THREE.ExtrudeGeometry(createStarShape(4, size, size * 0.35), {
    depth, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0
  g.add(mesh)
  return g
}

function createDiamond(mat: THREE.MeshStandardMaterial, size: number, depth: number): THREE.Group {
  const g = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(0, size)
  shape.lineTo(size * 0.5, 0)
  shape.lineTo(0, -size)
  shape.lineTo(-size * 0.5, 0)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0
  g.add(mesh)
  return g
}

function createClasp(mat: THREE.MeshStandardMaterial, depth: number): THREE.Group {
  const g = new THREE.Group()
  // Keep the clasp proportional to the new thicker geometry
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.12, depth * 2, 0.35), mat)
  base.position.y = depth
  
  const baseRivet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, depth * 2.5, 16), mat)
  baseRivet1.position.set(0, depth * 1.25, 0.12)
  
  const baseRivet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, depth * 2.5, 16), mat)
  baseRivet2.position.set(0, depth * 1.25, -0.12)
  
  g.add(base, baseRivet1, baseRivet2)

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, depth * 2.5, 0.1), mat)
  arm.position.set(0.08, depth * 1.25, 0)
  g.add(arm)

  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, depth * 3, 12), mat)
  knob.position.set(0.12, depth * 1.5, 0)
  g.add(knob)

  return g
}
