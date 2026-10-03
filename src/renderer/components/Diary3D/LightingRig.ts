import * as THREE from 'three'

/**
 * Creates a warm, atmospheric lighting rig for the diary scene.
 * Inspired by candlelight-on-a-desk aesthetic from the reference image.
 */
export function createLightingRig(scene: THREE.Scene) {
  // ── Ambient: cool blue fill ────────────────────────────────
  const ambient = new THREE.AmbientLight(0x1a243a, 0.6) // Reduced ambient to allow contrast
  scene.add(ambient)

  // ── Key: main directional warm light with shadows ───────────────
  const keyLight = new THREE.DirectionalLight(0xffeacc, 1.5) // Softer key
  keyLight.position.set(2.5, 6, 5)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.width = 2048
  keyLight.shadow.mapSize.height = 2048
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 25
  keyLight.shadow.camera.left = -6
  keyLight.shadow.camera.right = 6
  keyLight.shadow.camera.top = 6
  keyLight.shadow.camera.bottom = -6
  keyLight.shadow.bias = -0.0001
  keyLight.shadow.normalBias = 0.05
  keyLight.shadow.radius = 5 // Softens the PCFSoftShadowMap for realistic contact shadow
  scene.add(keyLight)

  // ── Fill: cool moonlight from the opposite side ─────────
  const fillLight = new THREE.PointLight(0x507ca8, 0.8, 18)
  fillLight.position.set(-5, 4, 4)
  scene.add(fillLight)

  // ── Rim: subtle warm rim light from behind to separate from background ───────────────────
  const rimLight = new THREE.PointLight(0xffd8b0, 0.9, 15)
  rimLight.position.set(3, 5, -5)
  scene.add(rimLight)

  // ── Candle glow: intense warm intimate point light ─────────────────
  const candleLight = new THREE.PointLight(0xff8833, 1.2, 12)
  candleLight.position.set(4, 2.5, 1) // Moved closer to ground to cast realistic warm light across cover
  scene.add(candleLight)

  // ── Bottom fill: prevent overly dark underside (very dim cool) ─────────────
  const bottomFill = new THREE.PointLight(0x223344, 0.2, 10)
  bottomFill.position.set(0, -1, 3)
  scene.add(bottomFill)

  return { ambient, keyLight, fillLight, rimLight, candleLight, bottomFill }
}

export type LightingRig = ReturnType<typeof createLightingRig>
