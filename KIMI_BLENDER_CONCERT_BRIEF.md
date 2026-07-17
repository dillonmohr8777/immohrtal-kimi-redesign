# Kimi brief: IMMOHRTAL Pittsburgh concert and Blender model

## Assignment

Build two connected deliverables for the IMMOHRTAL website:

1. A reusable Blender master scene and performer/venue model.
2. An optimized interactive web experience derived from that scene and integrated into this repository.

This assignment belongs exclusively to `dillonmohr8777/immohrtal-kimi-redesign`. Do not place any part of it in Bridge, BigOrange, the original `immohrtal-website`, or another client repository.

## Creative direction

Create a cinematic IMMOHRTAL concert venue that feels like a real event built inside Pittsburgh rather than a generic stage dropped in front of a skyline.

- Show an exterior Pittsburgh city environment around the venue: rivers, hills, recognizable yellow-bridge language, skyline silhouettes, industrial steel character, street lighting, weather, and depth beyond the building.
- Build a convincing venue exterior, concourse, entry sequence, stage, backstage areas, floor, seating, screens, lighting truss, speakers, haze, spotlights, lasers, practical lights, and branded signage.
- Fill the venue with a packed, varied crowd. Use instancing, level of detail, animation variation, and clustered behavior so the audience feels alive without destroying performance.
- Make the crowd and venue interactive: camera viewpoints, clickable or tappable hotspots, responsive lighting, crowd-energy states, stage reveals, and audio-reactive moments.
- Use the existing IMMOHRTAL visual language: white paper, dark gunmetal/chrome, electric blue signal light, green secondary energy, and controlled album-art accents.
- Use the approved IMMOHRTAL logo and imagery already in `public/`. The performer should be a recognizable, respectful stylized likeness based on the approved artist references in this repository.
- Design the performance as an album-length journey with distinct visual chapters, lighting cues, crowd responses, and Pittsburgh transitions for all eleven tracks of *Dance With The Delusional*.

## Approved repository references

- Primary logo and marks: `public/logo.jpg`, `public/logo-web.jpg`, `public/logo-mark.png`
- Artist references: `public/artist.jpg`, `public/about-portrait.jpg`, `public/press/photo-portrait.jpg`, and the other approved press images under `public/press/`
- Album art: `public/cover.jpg`
- Existing site color and typography system: `src/index.css` and `src/fonts.css`
- Album order and titles: `src/content/album.ts`

Do not infer the artist's appearance from unrelated personal files. Do not import client documents, credentials, private exports, or an entire personal directory.

## Audio workflow

Use only owner-approved audio. Seven 30-second preview clips are available locally for timing and audio-reactive prototyping; they are intentionally excluded from this public repository. The complete eleven-track album is not currently present in this workspace.

- Never commit unreleased full-length audio to Git.
- Keep local source audio outside `public/` during production.
- The public preview should use approved preview clips, muted timing data, or synthetic beat envelopes until the owner supplies and clears the final album files for release.
- Structure cues by track so final mastered files can be swapped in without rebuilding the scene.

## Required Blender deliverables

- `blender/immohrtal-pittsburgh-concert.blend` as the reusable master scene. Keep it under GitHub's file-size limit or document the Git LFS/artifact handoff before pushing it.
- `blender/scripts/build_scene.py` containing a repeatable, batched scene-generation and update workflow where practical.
- Organized collections for city, venue exterior, venue interior, stage, lighting, crowd, performer, cameras, and exports.
- Named cameras for exterior arrival, crowd entry, front of house, pit, stage, performer close-up, aerial Pittsburgh, and finale.
- Low-resolution preview renders for rapid review before expensive final rendering.
- A clean export collection for the website, with transforms applied and materials/textures packaged predictably.

## Required website deliverables

- `public/models/immohrtal-pittsburgh-concert.glb` or a small set of streamed GLB assets.
- Web-ready textures in WebP or AVIF, normally no larger than 2K unless a reviewed hero shot genuinely needs more.
- A poster or fallback render for devices without WebGL and for reduced-motion users.
- Progressive loading, visible load state, failure fallback, keyboard-accessible controls, touch support, and a reduced-motion mode.
- A mobile-safe performance budget. Target an initial model payload below 25 MB, use compressed geometry/textures, instance the crowd, and avoid loading the full stadium before the visitor chooses to enter the experience.
- Keep the existing site readable and usable if the 3D experience fails or is skipped.

## Autonomy and boundaries

Kimi may make strong creative and technical decisions inside this isolated repository, create branches, revise the website integration, and iterate on the Blender scene. Kimi must not alter the original `dillonmohr8777/immohrtal-website`, the Bridge repositories, production credentials, account ownership, or unrelated files.

Before every push:

1. Run `npm run build`.
2. Check desktop and phone layouts.
3. Test WebGL failure and reduced-motion fallbacks.
4. Record model size, texture size, page-weight impact, and known missing assets.
5. Commit with a descriptive message and return the GitHub commit plus `https://immohrtal-kimi-redesign.netlify.app`.
