import * as THREE from 'three'

/**
 * Creates a warm, atmospheric lighting rig for the diary scene.
 * Inspired by candlelight-on-a-desk aesthetic from the reference image.
 */
export function createLightingRig(scene: THREE.Scene) {
  // ── Ambient: cool blue fill ────────────────────────────────
  const ambient = new THREE.AmbientLight(0x1a243a, 0.8) // Brighter ambient to lift the darks
  scene.add(ambient)

  // ── Key: main directional warm light with shadows ───────────────
  const keyLight = new THREE.DirectionalLight(0xffeacc, 1.8) // Brighter and warmer
  keyLight.position.set(2.5, 6, 5) // Moved forward to catch specularity on the front cover
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
  scene.add(keyLight)

  // ── Fill: cool moonlight from the opposite side ─────────
  const fillLight = new THREE.PointLight(0x507ca8, 1.0, 18)
  fillLight.position.set(-5, 4, 4)
  scene.add(fillLight)

  // ── Rim: subtle warm rim light from behind to separate from background ───────────────────
  const rimLight = new THREE.PointLight(0xffd8b0, 1.2, 15)
  rimLight.position.set(3, 5, -5)
  scene.add(rimLight)

  // ── Candle glow: intense warm intimate point light ─────────────────
  const candleLight = new THREE.PointLight(0xff9944, 0.9, 12)
  candleLight.position.set(6, 3, -1)
  scene.add(candleLight)

  // ── Bottom fill: prevent overly dark underside (very dim cool) ─────────────
  const bottomFill = new THREE.PointLight(0x223344, 0.3, 10)
  bottomFill.position.set(0, -1, 3)
  scene.add(bottomFill)

  return { ambient, keyLight, fillLight, rimLight, candleLight, bottomFill }
}

export type LightingRig = ReturnType<typeof createLightingRig>
