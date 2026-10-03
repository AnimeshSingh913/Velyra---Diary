import * as THREE from 'three'

// ─── Procedural Textures ─────────────────────────────────────

function createLeatherBumpMap(): THREE.CanvasTexture {
  const size = 1024 // Higher res for fine detail
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const imageData = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      
      // Multi-frequency noise for deep leather grain and pores
      const n1 = (Math.sin(x * 0.1) * Math.cos(y * 0.1)) * 10
      const n2 = (Math.sin(x * 0.03 + y * 0.05)) * 25
      const n3 = (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 5 // fine pores
      const noise = (Math.random() - 0.5) * 15
      
      // Creates cell-like leather patterns
      const cellX = Math.floor(x / 8)
      const cellY = Math.floor(y / 8)
      const cellHash = Math.sin(cellX * 12.9898 + cellY * 78.233) * 43758.5453
      const cellNoise = (cellHash - Math.floor(cellHash)) * 15

      const value = Math.min(255, Math.max(0, 140 + n1 + n2 + n3 + noise - cellNoise))
      
      imageData.data[i] = value
      imageData.data[i + 1] = value
      imageData.data[i + 2] = value
      imageData.data[i + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function createPageEdgeTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const imageData = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    // Generate sharp horizontal striations for individual pages
    const pageLine = (Math.sin(y * 80) + Math.cos(y * 240)) * 12
    const pageGap = (y % 6 === 0 || y % 7 === 0) ? -25 : 0 // Darker gaps between sections
    const tonalVar = Math.sin(y * 5) * 10 // Large tonal bands
    
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const mottle = (Math.random() - 0.5) * 15 // Paper noise
      const val = Math.min(255, Math.max(0, 195 + pageLine + pageGap + tonalVar + mottle))
      
      imageData.data[i] = val       // R
      imageData.data[i + 1] = val * 0.92 // G (yellow/warm tint)
      imageData.data[i + 2] = val * 0.75 // B (aged)
      imageData.data[i + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createPaperBumpMap(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const imageData = ctx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
      const x = (i / 4) % size
      const y = Math.floor((i / 4) / size)
      
      // Wavy parchment texture
      const wave = Math.sin(x * 0.01) * Math.sin(y * 0.01) * 15
      const noise = Math.random() * 12
      const val = 128 + wave + noise
      
      imageData.data[i] = val
      imageData.data[i + 1] = val
      imageData.data[i + 2] = val
      imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// ─── Material Factory ────────────────────────────────────────

export function createBookMaterials() {
  const leatherBump = createLeatherBumpMap()
  const paperBump = createPaperBumpMap()
  const pageEdgeTex = createPageEdgeTexture()

  const cover = new THREE.MeshPhysicalMaterial({
    color: 0x5a1118, // Rich dark burgundy
    roughness: 0.65, 
    metalness: 0.05, 
    clearcoat: 0.15,
    clearcoatRoughness: 0.7,
    bumpMap: leatherBump,
    bumpScale: 0.04, 
    envMapIntensity: 0.8,
  })

  const spine = new THREE.MeshPhysicalMaterial({
    color: 0x3a0a10, // Slightly darker than cover
    roughness: 0.7,
    metalness: 0.05,
    clearcoat: 0.1,
    clearcoatRoughness: 0.75,
    bumpMap: leatherBump,
    bumpScale: 0.025,
    envMapIntensity: 0.8,
  })

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xcca652, // Warm antique brass/gold base
    roughness: 0.25,
    metalness: 0.95,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    emissive: new THREE.Color(0x110d02), // Very subtle warm floor
    emissiveIntensity: 0.5,
    bumpMap: leatherBump, 
    bumpScale: 0.015,
    envMapIntensity: 1.2,
  })

  const page = new THREE.MeshStandardMaterial({
    color: 0xf5e3c8, // Aged warm parchment
    roughness: 0.95,
    metalness: 0.0,
    bumpMap: paperBump,
    bumpScale: 0.005,
    envMapIntensity: 0.2,
  })

  const pageEdge = new THREE.MeshStandardMaterial({
    color: 0xdfd3b8, // Base edge color
    map: pageEdgeTex, // Layered page lines
    roughness: 0.85,
    metalness: 0.0,
    bumpMap: pageEdgeTex,
    bumpScale: 0.015, // stronger bump for page layers
    envMapIntensity: 0.2,
  })

  const clasp = new THREE.MeshPhysicalMaterial({
    color: 0xa88540,
    roughness: 0.3,
    metalness: 0.9,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.2,
  })

  return { cover, spine, gold, page, pageEdge, clasp }
}

export type BookMaterials = ReturnType<typeof createBookMaterials>
