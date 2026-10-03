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
    // Generate horizontal striations for individual pages
    const pageLine = Math.sin(y * 120) * 20
    const pageGap = (y % 4 === 0) ? -15 : 0 // Darker gaps between some pages
    
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const mottle = (Math.random() - 0.5) * 10
      const val = 200 + pageLine + pageGap + mottle
      
      imageData.data[i] = val       // R
      imageData.data[i + 1] = val * 0.95 // G (slight yellow tint)
      imageData.data[i + 2] = val * 0.8  // B
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

  const cover = new THREE.MeshStandardMaterial({
    color: 0x4a0e16, // Brighter, rich dark burgundy
    roughness: 0.65, // Lower roughness so it catches clear specular highlights
    metalness: 0.15, // Better specular response for polished leather
    bumpMap: leatherBump,
    bumpScale: 0.015, // Increased to make grain visibly catch light
  })

  const spine = new THREE.MeshStandardMaterial({
    color: 0x3a0a10, // Slightly darker than cover
    roughness: 0.75,
    metalness: 0.12,
    bumpMap: leatherBump,
    bumpScale: 0.015,
  })

  const gold = new THREE.MeshStandardMaterial({
    color: 0xffd470, // Brighter, clearer antique gold
    roughness: 0.25, // More reflective
    metalness: 0.95, // Higher metalness for realistic brass/gold
    bumpMap: leatherBump, 
    bumpScale: 0.008, // Subtle embossed texture on the metal
  })

  const page = new THREE.MeshStandardMaterial({
    color: 0xfff4de, // Slightly brighter warm parchment
    roughness: 0.95,
    metalness: 0.0,
    bumpMap: paperBump,
    bumpScale: 0.003,
  })

  const pageEdge = new THREE.MeshStandardMaterial({
    color: 0xdfd3b8, // Base edge color
    map: pageEdgeTex, // Layered page lines
    roughness: 0.9,
    metalness: 0.0,
    bumpMap: pageEdgeTex,
    bumpScale: 0.005,
  })

  const clasp = new THREE.MeshStandardMaterial({
    color: 0xa88540, // Brighter bronze
    roughness: 0.4,
    metalness: 0.9,
  })

  return { cover, spine, gold, page, pageEdge, clasp }
}

export type BookMaterials = ReturnType<typeof createBookMaterials>
