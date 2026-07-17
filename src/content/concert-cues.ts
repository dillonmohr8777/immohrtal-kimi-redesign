/**
 * Concert cue sheet — Dance With The Delusional (all 11 tracks).
 *
 * Mirrors the CUE_SHEET custom properties baked into
 * public/models/immohrtal-pittsburgh-concert.glb by
 * blender/scripts/build_scene.py.
 *
 * Audio: the seven owner-approved 30-second preview clips live outside this
 * repository (see KIMI_LOCAL_ASSETS.md on the owner's machine). When a clip
 * is cleared for public preview, drop it at
 * `public/audio/previews/track-XX.mp3` — the runtime auto-detects it and
 * switches that track from the muted synthetic beat envelope to real
 * audio-reactive analysis. No cue data has to change.
 */

export interface ConcertCue {
  track: number
  title: string
  chapter: string
  /** primary lighting/beam colour */
  primary: string
  /** secondary wash/laser colour */
  secondary: string
  /** 0..1 crowd energy target for this chapter */
  energy: number
  /** named camera baked into the GLB that frames this chapter */
  camera: string
  /** tempo used for the muted synthetic beat envelope */
  bpm: number
  /** seconds; 30 matches the approved preview clips, full length swaps later */
  duration: number
  /** preview clip path if the owner clears it for the public build */
  previewSrc: string | null
}

const CLIPS: Partial<Record<number, string>> = {
  2: 'audio/previews/02-picking-up-my-notepad.mp3',
  3: 'audio/previews/03-814-blood.mp3',
  4: 'audio/previews/04-my-mothers-baby.mp3',
  5: 'audio/previews/05-roll-the-dice.mp3',
  6: 'audio/previews/06-my-own-way.mp3',
  8: 'audio/previews/08-grade-a-love.mp3',
  9: 'audio/previews/09-on-my-way.mp3',
}

// Tracks 1–7 have approved 30-second local previews; 8–11 keep reserved
// slots so the mastered album drops in without a scene or code rebuild.
export const concertCues: ConcertCue[] = [
  { track: 1, title: 'No Way Out', chapter: 'Cold Open', primary: '#1f9eff', secondary: '#0d2a4a', energy: 0.35, camera: 'CAM_FOH', bpm: 74, duration: 30, previewSrc: null },
  { track: 2, title: 'Picking Up My Notepad', chapter: 'Paper', primary: '#f7f9fb', secondary: '#1f9eff', energy: 0.62, camera: 'CAM_Performer_CloseUp', bpm: 86, duration: 30, previewSrc: CLIPS[2]! },
  { track: 3, title: '814 Blood (ft. King Keev)', chapter: 'Steel', primary: '#c21f2c', secondary: '#1f4f9e', energy: 0.95, camera: 'CAM_Pit', bpm: 142, duration: 30, previewSrc: CLIPS[3]! },
  { track: 4, title: 'My Mothers Baby', chapter: 'Ember', primary: '#f5a63b', secondary: '#7a3b12', energy: 0.5, camera: 'CAM_Stage', bpm: 68, duration: 30, previewSrc: CLIPS[4]! },
  { track: 5, title: 'Roll the Dice', chapter: 'Green Room', primary: '#17a86b', secondary: '#0a3a24', energy: 0.88, camera: 'CAM_FOH', bpm: 128, duration: 30, previewSrc: CLIPS[5]! },
  { track: 6, title: 'My Own Way', chapter: 'Signal', primary: '#1f9eff', secondary: '#17a86b', energy: 0.82, camera: 'CAM_Pit', bpm: 118, duration: 30, previewSrc: CLIPS[6]! },
  { track: 7, title: 'Headstone (Interlude)', chapter: 'Interlude', primary: '#f7f9fb', secondary: '#141922', energy: 0.15, camera: 'CAM_Performer_CloseUp', bpm: 60, duration: 30, previewSrc: null },
  { track: 8, title: 'Grade A Love', chapter: 'Bloom', primary: '#c86bd8', secondary: '#17a86b', energy: 0.68, camera: 'CAM_Stage', bpm: 96, duration: 30, previewSrc: CLIPS[8]! },
  { track: 9, title: 'On My Way (ft. King Keev)', chapter: 'Arrival', primary: '#f2b82e', secondary: '#1f9eff', energy: 0.92, camera: 'CAM_Aerial_Pittsburgh', bpm: 124, duration: 30, previewSrc: CLIPS[9]! },
  { track: 10, title: 'Waitlist', chapter: 'Holding Pattern', primary: '#2fd4c4', secondary: '#0d2a4a', energy: 0.6, camera: 'CAM_FOH', bpm: 104, duration: 30, previewSrc: null },
  { track: 11, title: 'Dance with the Delusional (ft. Ted Moon)', chapter: 'Finale', primary: '#c21f2c', secondary: '#1f9eff', energy: 1.0, camera: 'CAM_Finale', bpm: 136, duration: 30, previewSrc: null },
]

export const CONCERT_CAMERAS = [
  { id: 'CAM_Exterior_Arrival', label: 'Arrival' },
  { id: 'CAM_Crowd_Entry', label: 'Entry' },
  { id: 'CAM_FOH', label: 'Front of house' },
  { id: 'CAM_Pit', label: 'The pit' },
  { id: 'CAM_Stage', label: 'On stage' },
  { id: 'CAM_Performer_CloseUp', label: 'Close-up' },
  { id: 'CAM_Aerial_Pittsburgh', label: 'Aerial' },
  { id: 'CAM_Finale', label: 'Finale' },
] as const

export type ConcertCameraId = (typeof CONCERT_CAMERAS)[number]['id']
