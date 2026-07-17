# Blender — IMMOHRTAL Pittsburgh concert scene

This directory holds the reusable master scene and the repeatable build
pipeline for the website's 3D venue chapter.

## Files

- `immohrtal-pittsburgh-concert.blend` — master scene (generated; do not hand-edit)
- `scripts/build_scene.py` — repeatable, batched scene generator
- `previews/` — low-resolution preview renders from the named cameras
- `references/` — approved reference imagery (not packed into exports)

## Rebuild everything (headless, Blender 4.2+)

```bash
blender -b -P blender/scripts/build_scene.py -- --all
```

This regenerates the master scene, saves the `.blend`, exports the optimized
web GLB to `public/models/immohrtal-pittsburgh-concert.glb`, renders the
preview stills, and writes `public/models/concert-poster.jpg` (the WebGL
fallback poster).

Useful variants:

```bash
# quick pass: smaller crowd, low-res renders
blender -b -P blender/scripts/build_scene.py -- --all --quick
# geometry + GLB only, no renders
blender -b -P blender/scripts/build_scene.py -- --export-glb --no-render
# renders only (uses the already-built scene)
blender -b -P blender/scripts/build_scene.py -- --previews-only
```

## Scene contract (used by the web runtime)

- Collections: `CITY`, `VENUE_EXT`, `VENUE_INT`, `STAGE`, `LIGHTING`, `CUES`,
  `CROWD`, `PERFORMER`, `CAMERAS`, `EXPORT`
- Named cameras: `CAM_Exterior_Arrival`, `CAM_Crowd_Entry`, `CAM_FOH`,
  `CAM_Pit`, `CAM_Stage`, `CAM_Performer_CloseUp`, `CAM_Aerial_Pittsburgh`,
  `CAM_Finale`
- The `CUE_SHEET` empty carries the JSON cue sheet (11 track chapters);
  `CUE_T01..CUE_T11` empties are the per-track lighting cue slots
- `CROWD_*` nodes carry `phase`/`cluster` custom properties (exported as
  glTF extras) that drive the audience animation in the browser
- `BEAM_*`, `LASER_*`, `SCREEN_*`, `SPOT_*` names drive per-chapter lighting
  in `src/concert/ConcertScene.ts`

Audio timing mirrors `src/content/concert-cues.ts`. The owner's seven local
30-second previews (see `KIMI_LOCAL_ASSETS.md`, local only) drop into
`public/audio/previews/track-XX.mp3` when cleared — no scene rebuild needed.
