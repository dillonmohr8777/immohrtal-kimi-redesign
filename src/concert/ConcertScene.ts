/**
 * ConcertScene — three.js runtime for the IMMOHRTAL Pittsburgh venue GLB.
 *
 * Everything is driven by object names and custom properties baked in by
 * blender/scripts/build_scene.py:
 *   CROWD_*     instanced audience; userData.phase drives the bounce
 *   PHONE_*     phone lights (emissive pulse)
 *   BEAM_*      spotlight beams (recolored per chapter, beat-pulsed)
 *   LASER_*     laser blades
 *   SCREEN_*    LED walls (emissive recolor per chapter)
 *   SPOT_*      punctual lights from the GLB
 *   CAM_*       named shot cameras (see src/content/concert-cues.ts)
 *
 * The engine is deliberately self-contained: the React wrapper lazy-loads
 * three.js only after the visitor chooses to enter the venue.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ConcertCue } from '../content/concert-cues'

export interface ConcertSceneOptions {
  canvas: HTMLCanvasElement
  modelUrl: string
  reducedMotion: boolean
  onProgress?: (ratio: number) => void
  onReady?: () => void
  onError?: (message: string) => void
}

interface CrowdMember {
  object: THREE.Object3D
  baseY: number
  phase: number
  cluster: string
}

const tmpColor = new THREE.Color()
const tmpColor2 = new THREE.Color()

export class ConcertScene {
  private opts: ConcertSceneOptions
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private raf = 0
  private running = false
  private disposed = false

  private shotCameras = new Map<string, THREE.PerspectiveCamera>()
  private cameraTarget = { pos: new THREE.Vector3(0, 18, 9), quat: new THREE.Quaternion() }
  private cameraBlend = 1

  private crowd: CrowdMember[] = []
  private phones: THREE.Mesh[] = []
  private beamMats: THREE.MeshBasicMaterial[] = []
  private laserMats: THREE.MeshBasicMaterial[] = []
  private screenMats: THREE.MeshStandardMaterial[] = []
  private spotLights: THREE.SpotLight[] = []
  private marqueeMats: THREE.MeshBasicMaterial[] = []

  private cue: ConcertCue | null = null
  private beatClock = 0
  private level = 0.35
  private energy = 0.35
  private primary = new THREE.Color('#1f9eff')
  private secondary = new THREE.Color('#0d2a4a')
  private primaryTarget = new THREE.Color('#1f9eff')
  private secondaryTarget = new THREE.Color('#0d2a4a')

  constructor(opts: ConcertSceneOptions) {
    this.opts = opts
    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.35
    const dpr = Math.min(window.devicePixelRatio || 1, this.isSmallScreen() ? 1.6 : 2)
    this.renderer.setPixelRatio(dpr)

    this.camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 900)
    this.camera.position.set(0, 18, 9)

    this.scene.background = new THREE.Color('#030711')
    this.scene.fog = new THREE.Fog('#050a16', 90, 420)

    // House ambience so gunmetal never crushes to black.
    const hemi = new THREE.HemisphereLight('#33496a', '#0a0e18', 1.6)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight('#9db8dd', 1.1)
    key.position.set(30, 60, 40)
    this.scene.add(key)
    // Cool rim from behind the stage so the crowd reads against the dark.
    const rim = new THREE.DirectionalLight('#3d6fb4', 0.7)
    rim.position.set(-20, 45, -60)
    this.scene.add(rim)

    this.resize()
    window.addEventListener('resize', this.resize)
  }

  private isSmallScreen() {
    return Math.min(window.innerWidth, window.innerHeight) < 720
  }

  async load() {
    const loader = new GLTFLoader()
    try {
      const gltf = await loader.loadAsync(this.opts.modelUrl, (event) => {
        if (event.total > 0) this.opts.onProgress?.(event.loaded / event.total)
      })
      this.prepare(gltf.scene)
      this.opts.onProgress?.(1)
      this.opts.onReady?.()
    } catch (error) {
      this.opts.onError?.(error instanceof Error ? error.message : 'Model failed to load')
    }
  }

  private prepare(root: THREE.Object3D) {
    root.traverse((obj) => {
      const name = obj.name

      if (obj instanceof THREE.PerspectiveCamera && name.startsWith('CAM_')) {
        this.shotCameras.set(name, obj)
        return
      }
      if (obj instanceof THREE.SpotLight) {
        this.spotLights.push(obj)
        return
      }
      if (!(obj instanceof THREE.Mesh)) return

      if (name.startsWith('CROWD_')) {
        const phase = typeof obj.userData.phase === 'number' ? obj.userData.phase : Math.random() * Math.PI * 2
        this.crowd.push({
          object: obj,
          baseY: obj.position.y,
          phase,
          cluster: typeof obj.userData.cluster === 'string' ? obj.userData.cluster : 'floor',
        })
        const mat = obj.material as THREE.MeshStandardMaterial
        if (mat && 'roughness' in mat) {
          mat.roughness = 0.9
          mat.metalness = 0
        }
        return
      }

      if (name.startsWith('PHONE_')) {
        this.phones.push(obj)
        this.toBasic(obj, 1.6)
        return
      }
      if (name.startsWith('BEAM_')) {
        const mat = this.toBasic(obj, 1)
        mat.transparent = true
        mat.opacity = 0.34
        mat.blending = THREE.AdditiveBlending
        mat.depthWrite = false
        this.beamMats.push(mat)
        return
      }
      if (name.startsWith('LASER_')) {
        const mat = this.toBasic(obj, 1)
        mat.transparent = true
        mat.opacity = 0.8
        mat.blending = THREE.AdditiveBlending
        mat.depthWrite = false
        this.laserMats.push(mat)
        return
      }
      if (name.startsWith('SCREEN_')) {
        this.screenMats.push(obj.material as THREE.MeshStandardMaterial)
        return
      }
      if (name.startsWith('MARQUEE_text') || name.startsWith('MARQUEE_sub')) {
        this.marqueeMats.push(this.toBasic(obj, 1))
        return
      }
    })

    // Frustum culling off for crowd (positions animated on CPU, tiny meshes).
    for (const member of this.crowd) member.object.frustumCulled = false

    this.scene.add(root)

    // Park on FOH for the first frame.
    const foh = this.shotCameras.get('CAM_FOH')
    if (foh) {
      foh.getWorldPosition(this.cameraTarget.pos)
      foh.getWorldQuaternion(this.cameraTarget.quat)
      this.camera.position.copy(this.cameraTarget.pos)
      this.camera.quaternion.copy(this.cameraTarget.quat)
    }
  }

  /** Swap a mesh to an unlit material we can drive per-frame. */
  private toBasic(mesh: THREE.Mesh, intensity: number): THREE.MeshBasicMaterial {
    const old = mesh.material as THREE.MeshStandardMaterial
    const mat = new THREE.MeshBasicMaterial({ color: old.color ? old.color.clone() : new THREE.Color('#ffffff') })
    if (old.emissive && old.emissive.getHex() !== 0) mat.color.copy(old.emissive)
    mat.color.multiplyScalar(intensity)
    mesh.material = mat
    return mat
  }

  // ---------------------------------------------------------------- public

  setCamera(id: string) {
    const cam = this.shotCameras.get(id)
    if (!cam) return
    cam.getWorldPosition(this.cameraTarget.pos)
    cam.getWorldQuaternion(this.cameraTarget.quat)
    if (this.opts.reducedMotion) {
      this.camera.position.copy(this.cameraTarget.pos)
      this.camera.quaternion.copy(this.cameraTarget.quat)
      this.cameraBlend = 1
    } else {
      this.cameraBlend = 0
    }
  }

  setChapter(cue: ConcertCue) {
    this.cue = cue
    this.energy = cue.energy
    this.primaryTarget.set(cue.primary)
    this.secondaryTarget.set(cue.secondary)
  }

  /** 0..1 audio (or synthetic-envelope) level for the current frame. */
  setLevel(level: number) {
    this.level = THREE.MathUtils.clamp(level, 0, 1)
  }

  play() {
    if (this.running || this.disposed) return
    this.running = true
    this.clock.start()
    this.tick()
  }

  pause() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  dispose() {
    this.disposed = true
    this.pause()
    window.removeEventListener('resize', this.resize)
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mat = obj.material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose()
      }
    })
    this.renderer.dispose()
  }

  resize = () => {
    const { canvas } = this.opts
    const parent = canvas.parentElement
    const width = parent ? parent.clientWidth : window.innerWidth
    const height = parent ? parent.clientHeight : Math.round(width * 0.5625)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  // --------------------------------------------------------------- private

  private tick = () => {
    if (!this.running || this.disposed) return
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    const rm = this.opts.reducedMotion

    // Chapter colour tween.
    const blend = rm ? 1 : 1 - Math.pow(0.001, dt)
    this.primary.lerp(this.primaryTarget, blend)
    this.secondary.lerp(this.secondaryTarget, blend)

    // Beat clock from the cue tempo.
    const bpm = this.cue?.bpm ?? 100
    this.beatClock += dt * (bpm / 60)
    const beat = Math.pow(1 - (this.beatClock % 1), 2.2)
    const level = Math.max(this.level, beat * 0.6)

    // Beams: chapter colour, beat + level intensity.
    for (const mat of this.beamMats) {
      mat.color.copy(this.primary)
      mat.opacity = rm ? 0.32 : 0.2 + 0.3 * level + 0.12 * this.energy
    }
    for (const mat of this.laserMats) {
      mat.color.copy(this.secondary)
      mat.opacity = rm ? 0.55 : 0.35 + 0.55 * level
    }
    for (const mat of this.screenMats) {
      mat.emissive.copy(tmpColor.copy(this.primary).lerp(this.secondary, 0.35))
      mat.emissiveIntensity = rm ? 1.6 : 1.2 + 1.6 * level
    }
    for (const light of this.spotLights) {
      light.color.copy(tmpColor2.copy(this.primary).lerp(this.secondary, 0.25))
      light.intensity = rm ? 900 : 700 + 2600 * level
    }
    for (const mat of this.marqueeMats) {
      mat.color.copy(this.primary).multiplyScalar(1.4)
    }

    // Crowd bounce: clustered sine + beat kick, scaled by chapter energy.
    if (!rm) {
      const amp = 0.09 + 0.22 * this.energy * (0.45 + 0.55 * level)
      for (let i = 0; i < this.crowd.length; i++) {
        const member = this.crowd[i]
        const clusterOffset = member.cluster === 'floor' ? 0 : 1.4
        member.object.position.y =
          member.baseY + Math.max(0, Math.sin(t * (bpm / 60) * Math.PI + member.phase + clusterOffset)) * amp
      }
      for (let i = 0; i < this.phones.length; i++) {
        const phone = this.phones[i]
        const mat = phone.material as THREE.MeshBasicMaterial
        mat.color.setScalar(0.75 + 0.45 * Math.sin(t * 2.4 + i * 1.7))
      }
    }

    // Camera rail tween.
    if (this.cameraBlend < 1) {
      this.cameraBlend = Math.min(1, this.cameraBlend + dt * 1.4)
      const k = 1 - Math.pow(1 - this.cameraBlend, 3)
      this.camera.position.lerp(this.cameraTarget.pos, k)
      this.camera.quaternion.slerp(this.cameraTarget.quat, k)
    }

    this.renderer.render(this.scene, this.camera)
  }
}
