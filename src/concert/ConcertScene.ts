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
  performanceVideoUrl: string
  artistPortraitUrl: string
  logoUrl: string
  reducedMotion: boolean
  onProgress?: (ratio: number) => void
  onReady?: () => void
  onError?: (message: string) => void
}

interface CrowdMember {
  object: THREE.Object3D
  baseY: number
  baseRotationY: number
  baseRotationZ: number
  baseScale: THREE.Vector3
  phase: number
  cluster: string
}

interface PerformerPart {
  object: THREE.Object3D
  baseQuaternion: THREE.Quaternion
  baseScale: THREE.Vector3
}

const tmpColor = new THREE.Color()
const tmpColor2 = new THREE.Color()
const tmpQuat = new THREE.Quaternion()
const axisX = new THREE.Vector3(1, 0, 0)
const axisY = new THREE.Vector3(0, 1, 0)
const axisZ = new THREE.Vector3(0, 0, 1)

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
  private performerRoot: THREE.Object3D | null = null
  private performerBasePosition = new THREE.Vector3()
  private performerBaseRotationY = 0
  private performerParts = new Map<string, PerformerPart>()
  private performanceVideo: HTMLVideoElement | null = null
  private artistSprite: THREE.Sprite | null = null
  private mediaTextures: THREE.Texture[] = []

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

      if (name === 'PERFORMER_IMMOHRTAL') {
        this.performerRoot = obj
        this.performerBasePosition.copy(obj.position)
        this.performerBaseRotationY = obj.rotation.y
      }
      if (name.startsWith('PERF_')) {
        this.performerParts.set(name, {
          object: obj,
          baseQuaternion: obj.quaternion.clone(),
          baseScale: obj.scale.clone(),
        })
      }

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
          baseRotationY: obj.rotation.y,
          baseRotationZ: obj.rotation.z,
          baseScale: obj.scale.clone(),
          phase,
          cluster: typeof obj.userData.cluster === 'string' ? obj.userData.cluster : 'floor',
        })
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const material of materials) {
          const mat = material as THREE.MeshStandardMaterial
          if (mat && 'roughness' in mat) {
            mat.roughness = 0.82
            mat.metalness = 0
          }
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
    this.installCameraRail()
    this.setupStageMedia(root)

    // Park on FOH for the first frame.
    const foh = this.shotCameras.get('CAM_FOH')
    if (foh) {
      foh.getWorldPosition(this.cameraTarget.pos)
      foh.getWorldQuaternion(this.cameraTarget.quat)
      this.camera.position.copy(this.cameraTarget.pos)
      this.camera.quaternion.copy(this.cameraTarget.quat)
    }
  }

  /**
   * Blender and glTF use different up axes. Imported camera quaternions were
   * intermittently landing below the audience in browsers, so the rail uses
   * explicit converted positions and look targets. Blender (x, y, z) becomes
   * three.js (x, z, -y).
   */
  private installCameraRail() {
    const specs: Array<[string, THREE.Vector3, THREE.Vector3]> = [
      ['CAM_Exterior_Arrival', new THREE.Vector3(0, 16, -82), new THREE.Vector3(-4, 17, -26)],
      ['CAM_Crowd_Entry', new THREE.Vector3(-30, 3.4, -8), new THREE.Vector3(0, 4, 12)],
      ['CAM_FOH', new THREE.Vector3(0, 8.5, -2), new THREE.Vector3(0, 6.5, 24)],
      ['CAM_Pit', new THREE.Vector3(3.5, 2.4, 16), new THREE.Vector3(0, 5.8, 30)],
      ['CAM_Stage', new THREE.Vector3(-12, 6, 20), new THREE.Vector3(4, 6, 30)],
      ['CAM_Performer_CloseUp', new THREE.Vector3(2.6, 6.2, 13), new THREE.Vector3(0, 6.6, 22.4)],
      ['CAM_Aerial_Pittsburgh', new THREE.Vector3(-95, 70, -95), new THREE.Vector3(-10, 0, -10)],
      ['CAM_Finale', new THREE.Vector3(24, 14, -26), new THREE.Vector3(0, 8, 28)],
    ]
    for (const [name, position, target] of specs) {
      const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 900)
      camera.position.copy(position)
      camera.lookAt(target)
      camera.updateMatrixWorld(true)
      this.shotCameras.set(name, camera)
    }
  }

  /** Put real IMMOHRTAL media on the arena LED walls. */
  private setupStageMedia(root: THREE.Object3D) {
    const main = root.getObjectByName('SCREEN_main') as THREE.Mesh | undefined
    const left = root.getObjectByName('SCREEN_side_-1') as THREE.Mesh | undefined
    const right = root.getObjectByName('SCREEN_side_1') as THREE.Mesh | undefined

    const video = document.createElement('video')
    video.src = this.opts.performanceVideoUrl
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    this.performanceVideo = video
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.colorSpace = THREE.SRGBColorSpace
    videoTexture.flipY = false
    this.mediaTextures.push(videoTexture)
    if (main) this.applyScreenTexture(main, videoTexture)
    void video.play().catch(() => {})

    const loader = new THREE.TextureLoader()
    loader.load(this.opts.artistPortraitUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      this.mediaTextures.push(texture)
      if (left) this.applyScreenTexture(left, texture)
      this.installArtistSprite(texture)
    })
    loader.load(this.opts.logoUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      this.mediaTextures.push(texture)
      if (right) this.applyScreenTexture(right, texture, true)
    })
  }

  private applyScreenTexture(screen: THREE.Mesh, texture: THREE.Texture, transparent = false) {
    const old = screen.material as THREE.Material
    screen.material = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      transparent,
      side: THREE.DoubleSide,
    })
    old.dispose()
  }

  /** A camera-facing artist image keeps Dillon recognizable in every shot. */
  private installArtistSprite(texture: THREE.Texture) {
    // glTF screen UVs need flipY=false, while a Sprite uses normal canvas UVs.
    const spriteTexture = texture.clone()
    spriteTexture.flipY = true
    spriteTexture.needsUpdate = true
    this.mediaTextures.push(spriteTexture)
    const material = new THREE.SpriteMaterial({
      map: spriteTexture,
      toneMapped: false,
      transparent: true,
      opacity: 0.96,
    })
    const sprite = new THREE.Sprite(material)
    sprite.name = 'PERF_artist_live_portrait'
    sprite.position.set(0, 6.45, 21.55)
    sprite.scale.set(5.8, 4.15, 1)
    sprite.renderOrder = 5
    this.artistSprite = sprite
    this.scene.add(sprite)
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
    void this.performanceVideo?.play()
    this.tick()
  }

  pause() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.performanceVideo?.pause()
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
    if (this.performanceVideo) {
      this.performanceVideo.pause()
      this.performanceVideo.removeAttribute('src')
      this.performanceVideo.load()
      this.performanceVideo = null
    }
    for (const texture of this.mediaTextures) texture.dispose()
    this.mediaTextures = []
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

    // Crowd dance: jumps, shoulder sway, and wave clusters instead of a
    // uniform vertical bob. The rebuilt GLB supplies varied human silhouettes.
    if (!rm) {
      const amp = 0.08 + 0.58 * this.energy * (0.35 + 0.65 * level)
      for (let i = 0; i < this.crowd.length; i++) {
        const member = this.crowd[i]
        const clusterOffset = member.cluster === 'floor' ? 0 : 1.4
        const pulse = Math.sin(t * (bpm / 60) * Math.PI + member.phase + clusterOffset)
        const jump = Math.pow(Math.max(0, pulse), 1.8) * amp
        member.object.position.y = member.baseY + jump
        member.object.rotation.y = member.baseRotationY + Math.sin(t * 1.7 + member.phase) * (0.06 + this.energy * 0.16)
        member.object.rotation.z = member.baseRotationZ + Math.sin(t * 2.15 + member.phase * 0.7) * (0.025 + this.energy * 0.07)
        const squash = 1 - Math.min(0.08, jump * 0.12)
        member.object.scale.set(
          member.baseScale.x / Math.sqrt(squash),
          member.baseScale.y * squash,
          member.baseScale.z / Math.sqrt(squash),
        )
      }
      for (let i = 0; i < this.phones.length; i++) {
        const phone = this.phones[i]
        const mat = phone.material as THREE.MeshBasicMaterial
        mat.color.setScalar(0.75 + 0.45 * Math.sin(t * 2.4 + i * 1.7))
      }

      // IMMOHRTAL works the thrust, nods on the pocket, pumps the free arm,
      // and keeps the microphone hand alive on every beat.
      if (this.performerRoot) {
        const stride = Math.sin(t * 0.72) * 2.25
        const bounce = Math.max(0, Math.sin(this.beatClock * Math.PI)) * (0.08 + 0.2 * level)
        this.performerRoot.position.copy(this.performerBasePosition)
        this.performerRoot.position.x += stride
        this.performerRoot.position.y += bounce
        this.performerRoot.rotation.y = this.performerBaseRotationY + Math.sin(t * 0.72) * 0.12
        if (this.artistSprite) {
          this.artistSprite.position.x = stride
          this.artistSprite.position.y = 6.45 + bounce + Math.sin(t * 1.35) * 0.08
          const pulse = 1 + beat * 0.035
          this.artistSprite.scale.set(5.8 * pulse, 4.15 * pulse, 1)
        }
      }
      this.posePerformer('PERF_head', axisX, -0.08 + beat * 0.18)
      this.posePerformer('PERF_upperarm_L', axisZ, -0.25 - level * 0.9)
      this.posePerformer('PERF_forearm_L', axisX, 0.18 + beat * 0.75)
      this.posePerformer('PERF_upperarm_R', axisX, Math.sin(t * 2.1) * 0.12)
      this.posePerformer('PERF_forearm_R', axisZ, Math.sin(t * 2.5) * 0.08)
      this.posePerformer('PERF_torso', axisY, Math.sin(t * 1.4) * 0.08)
      const mouth = this.performerParts.get('PERF_mouth')
      if (mouth) {
        mouth.object.scale.copy(mouth.baseScale)
        mouth.object.scale.y *= 1 + level * 2.8
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

  private posePerformer(name: string, axis: THREE.Vector3, angle: number) {
    const part = this.performerParts.get(name)
    if (!part) return
    part.object.quaternion.copy(part.baseQuaternion).multiply(tmpQuat.setFromAxisAngle(axis, angle))
  }
}
