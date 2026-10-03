import * as THREE from 'three'

/**
 * Creates all gold decorative ornaments for the front cover.
 * Original design: celestial/arcane motif — no copyrighted artwork.
 */
export function createCoverOrnaments(
  goldMaterial: THREE.MeshStandardMaterial,
  coverW: number,
  coverH: number
): THREE.Group {
  const group = new THREE.Group()
  const ornamentDepth = 0.02 // Thicker for realism

  // ─── Border Frame ──────────────────────────────────────────
  const inset = 0.18
  const bw = coverW - inset * 2
  const bh = coverH - inset * 2
  const barThick = 0.025

  // Horizontal bars (top, bottom)
  for (const zSign of [1, -1]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(bw, ornamentDepth, barThick),
      goldMaterial
    )
    bar.position.set(0, 0, zSign * (bh / 2))
    group.add(bar)
  }
  // Vertical bars (left, right)
  for (const xSign of [1, -1]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(barThick, ornamentDepth, bh),
      goldMaterial
    )
    bar.position.set(xSign * (bw / 2), 0, 0)
    group.add(bar)
  }

  // ─── Inner Border Frame ────────────────────────────────────
  const innerInset = 0.35
  const ibw = coverW - innerInset * 2
  const ibh = coverH - innerInset * 2
  const innerBarThick = 0.01

  // Horizontal inner bars
  for (const zSign of [1, -1]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(ibw, ornamentDepth * 0.5, innerBarThick),
      goldMaterial
    )
    bar.position.set(0, 0, zSign * (ibh / 2))
    group.add(bar)
  }
  // Vertical inner bars
  for (const xSign of [1, -1]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(innerBarThick, ornamentDepth * 0.5, ibh),
      goldMaterial
    )
    bar.position.set(xSign * (ibw / 2), 0, 0)
    group.add(bar)
  }

  // ─── Corner Ornaments ─────────────────────────────────────
  const corners: [number, number, number][] = [
    [-bw / 2, 0, bh / 2],
    [bw / 2, 0, bh / 2],
    [-bw / 2, 0, -bh / 2],
    [bw / 2, 0, -bh / 2],
  ]
  const cornerRotations = [0, Math.PI / 2, -Math.PI / 2, Math.PI]

  corners.forEach(([cx, cy, cz], idx) => {
    const corner = createCornerPiece(goldMaterial, ornamentDepth)
    corner.position.set(cx, cy, cz)
    corner.rotation.y = cornerRotations[idx]
    group.add(corner)
  })

  // ─── Central Emblem ────────────────────────────────────────
  const emblem = createCentralEmblem(goldMaterial, ornamentDepth)
  group.add(emblem)

  // ─── Decorative line from emblem to top/bottom ─────────────
  for (const zDir of [1, -1]) {
    const lineLen = bh * 0.18
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, ornamentDepth, lineLen),
      goldMaterial
    )
    line.position.set(0, 0, zDir * (0.45 + lineLen / 2))
    group.add(line)

    // Small diamond at end
    const diamond = createDiamond(goldMaterial, 0.04, ornamentDepth)
    diamond.position.set(0, 0, zDir * (0.45 + lineLen + 0.05))
    group.add(diamond)
  }

  // ─── Star Accents ─────────────────────────────────────────
  const starPositions: [number, number][] = [
    [bw * 0.32, bh * 0.35],
    [-bw * 0.32, bh * 0.35],
    [bw * 0.32, -bh * 0.35],
    [-bw * 0.32, -bh * 0.35],
    [bw * 0.15, bh * 0.42],
    [-bw * 0.15, bh * 0.42],
    [bw * 0.15, -bh * 0.42],
    [-bw * 0.15, -bh * 0.42],
    [0, bh * 0.45],
    [0, -bh * 0.45],
  ]

  starPositions.forEach(([sx, sz]) => {
    const size = 0.02 + Math.random() * 0.02
    const star = createFourPointStar(goldMaterial, size, ornamentDepth)
    star.position.set(sx, 0, sz)
    star.rotation.y = Math.random() * Math.PI
    group.add(star)
  })

  // ─── Clasp on right edge ──────────────────────────────────
  const claspGroup = createClasp(goldMaterial, ornamentDepth)
  claspGroup.position.set(coverW / 2 - 0.02, 0, 0)
  group.add(claspGroup)

  return group
}

// ─── Corner Piece ──────────────────────────────────────────────

function createCornerPiece(
  material: THREE.MeshStandardMaterial,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  const armLen = 0.22
  const armW = 0.04

  // Horizontal arm
  const hArm = new THREE.Mesh(
    new THREE.BoxGeometry(armLen, depth, armW),
    material
  )
  hArm.position.set(armLen / 2, 0, -armW / 2)
  g.add(hArm)

  // Vertical arm
  const vArm = new THREE.Mesh(
    new THREE.BoxGeometry(armW, depth, armLen),
    material
  )
  vArm.position.set(armW / 2, 0, -armLen / 2)
  g.add(vArm)
  
  // Rivets on arms
  const rivetGeo = new THREE.SphereGeometry(0.015, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const rivet1 = new THREE.Mesh(rivetGeo, material)
  rivet1.position.set(armLen * 0.8, depth / 2, -armW / 2)
  g.add(rivet1)
  
  const rivet2 = new THREE.Mesh(rivetGeo, material)
  rivet2.position.set(armW / 2, depth / 2, -armLen * 0.8)
  g.add(rivet2)

  // Decorative circle at the joint
  const circle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, depth * 1.5, 16),
    material
  )
  circle.position.set(0.02, 0, -0.02)
  g.add(circle)

  // Small scroll curve (using a torus segment)
  const scrollRadius = 0.06
  const scroll = new THREE.Mesh(
    new THREE.TorusGeometry(scrollRadius, 0.008, 8, 12, Math.PI * 0.7),
    material
  )
  scroll.rotation.x = -Math.PI / 2
  scroll.position.set(armLen * 0.6, 0, -0.02)
  g.add(scroll)

  const scroll2 = new THREE.Mesh(
    new THREE.TorusGeometry(scrollRadius, 0.008, 8, 12, Math.PI * 0.7),
    material
  )
  scroll2.rotation.x = -Math.PI / 2
  scroll2.rotation.z = Math.PI / 2
  scroll2.position.set(0.02, 0, -armLen * 0.6)
  g.add(scroll2)

  return g
}

// ─── Central Emblem ────────────────────────────────────────────

function createCentralEmblem(
  material: THREE.MeshStandardMaterial,
  depth: number
): THREE.Group {
  const g = new THREE.Group()

  // Central large diamond
  const diamondShape = new THREE.Shape()
  const dw = 0.25, dh = 0.45
  diamondShape.moveTo(0, dh)
  diamondShape.lineTo(dw, 0)
  diamondShape.lineTo(0, -dh)
  diamondShape.lineTo(-dw, 0)
  diamondShape.closePath()

  // Inner cutout for the diamond
  const innerHole = new THREE.Path()
  const idw = 0.18, idh = 0.35
  innerHole.moveTo(0, idh)
  innerHole.lineTo(idw, 0)
  innerHole.lineTo(0, -idh)
  innerHole.lineTo(-idw, 0)
  innerHole.closePath()
  diamondShape.holes.push(innerHole)

  const diamondGeo = new THREE.ExtrudeGeometry(diamondShape, {
    depth: depth * 1.5,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  })
  const diamond = new THREE.Mesh(diamondGeo, material)
  diamond.rotation.x = -Math.PI / 2
  diamond.position.y = depth * 0.75
  g.add(diamond)
  
  // Solid Base plate behind diamond to give physical depth
  const baseShape = new THREE.Shape()
  baseShape.moveTo(0, dh + 0.05)
  baseShape.lineTo(dw + 0.05, 0)
  baseShape.lineTo(0, -dh - 0.05)
  baseShape.lineTo(-dw - 0.05, 0)
  baseShape.closePath()
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: depth * 0.5,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02
  })
  const basePlate = new THREE.Mesh(baseGeo, material)
  basePlate.rotation.x = -Math.PI / 2
  basePlate.position.y = 0
  g.add(basePlate)

  // Intersecting arcane ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.015, 12, 48),
    material
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = depth * 1.2
  g.add(ring)

  // Central 8-pointed star inside the diamond
  const starShape = createStarShape(8, 0.12, 0.04)
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: depth * 2,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003,
  })
  const star = new THREE.Mesh(starGeo, material)
  star.rotation.x = -Math.PI / 2
  star.position.y = depth * 0.5
  g.add(star)

  // 4 small satellite stars on the ring
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4
    const r = 0.28
    const satStar = createFourPointStar(material, 0.03, depth * 1.5)
    satStar.position.set(Math.cos(angle) * r, depth * 0.8, Math.sin(angle) * r)
    // Rotate to point outward
    satStar.rotation.y = -angle
    g.add(satStar)
  }

  return g
}

// ─── Small Star ────────────────────────────────────────────────

function createStarShape(
  points: number,
  outerR: number,
  innerR: number
): THREE.Shape {
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

function createFourPointStar(
  material: THREE.MeshStandardMaterial,
  size: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  const starShape = createStarShape(4, size, size * 0.35)
  const geo = new THREE.ExtrudeGeometry(starShape, {
    depth: depth,
    bevelEnabled: false,
  })
  const mesh = new THREE.Mesh(geo, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = depth * 0.5
  g.add(mesh)
  return g
}

// ─── Diamond ───────────────────────────────────────────────────

function createDiamond(
  material: THREE.MeshStandardMaterial,
  size: number,
  depth: number
): THREE.Group {
  const g = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(0, size)
  shape.lineTo(size * 0.5, 0)
  shape.lineTo(0, -size)
  shape.lineTo(-size * 0.5, 0)
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
  })
  const mesh = new THREE.Mesh(geo, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = depth * 0.5
  g.add(mesh)
  return g
}

// ─── Clasp ─────────────────────────────────────────────────────

function createClasp(
  material: THREE.MeshStandardMaterial,
  depth: number
): THREE.Group {
  const g = new THREE.Group()

  // Base plate
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, depth * 2, 0.35),
    material
  )
  // Give base plate some rounded features
  const baseRivet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, depth*2.5, 16), material)
  baseRivet1.position.set(0, 0, 0.12)
  g.add(baseRivet1)
  const baseRivet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, depth*2.5, 16), material)
  baseRivet2.position.set(0, 0, -0.12)
  g.add(baseRivet2)
  g.add(base)

  // Swing arm
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, depth * 2.5, 0.1),
    material
  )
  arm.position.set(0.08, 0, 0)
  g.add(arm)

  // Latch knob
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, depth * 3, 8),
    material
  )
  knob.position.set(0.12, 0, 0)
  g.add(knob)

  return g
}
