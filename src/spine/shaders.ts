/**
 * GLSL for the spine world — ported from mohr-media-site/assets/spine.js.
 * Changes from the original:
 *  - color ramp is fed via uColA/uColB/uColC uniforms (was hardcoded)
 *  - uAudio uniform: live track energy drives the waveform-grid
 *    amplitude, the vortex glow, and a global brightness lift
 *  - Mohr-only uniforms removed (agent hover, CTA burn)
 *  - station-position constants derive from the section count so
 *    geometry and shader can never drift
 */

import { SPINE_SECTIONS } from './config'

const N_STATIONS = SPINE_SECTIONS.length
/** normalized spine position of station k */
export const stationV = (k: number) => k / (N_STATIONS - 1)

const WAVE_V = stationV(2).toFixed(4) // waveform grid (tracks)
const VORT_V = stationV(4).toFixed(4) // speaker-cone vortex (visuals)

export const buildPointVS = (dark: boolean) => `
attribute vec3 aHome; attribute vec3 aScatter; attribute vec3 aMeta;
uniform mat4 uProj; uniform mat4 uView;
uniform float uTime, uMaxV, uFocusV, uVel, uPulse, uPulseV, uSizeMul, uMinPx, uAspect, uAudio;
uniform vec2 uMouse;
uniform vec3 uColA, uColB, uColC;
varying vec3 vCol; varying float vA;
void main(){
  float v = aMeta.x; float rnd = aMeta.y; float role = aMeta.z;
  float assemble = smoothstep(v - 0.10, v - 0.03, uMaxV);
  vec3 pos = mix(aScatter, aHome, assemble);
  float da = (1.0 - assemble) * 0.6 + 0.045;
  pos += da * vec3(sin(uTime*0.7 + rnd*31.0), sin(uTime*0.55 + rnd*47.0), cos(uTime*0.62 + rnd*23.0)) * (0.3 + 0.7*rnd);
  float isRing = step(0.5, role) * (1.0 - step(1.5, role));
  float isStn  = step(1.5, role) * (1.0 - step(2.5, role));
  float isDust = step(2.5, role);
  float wGate = isStn * exp(-pow((v - ${WAVE_V}) * 22.0, 2.0));
  pos.y += sin(pos.x*2.6 + uTime*0.9) * cos(pos.z*2.6 + uTime*0.7) * (0.22 + 0.5*uAudio) * wGate;
  float vGate = isStn * exp(-pow((v - ${VORT_V}) * 22.0, 2.0));
  float lit = exp(-pow((v - uFocusV) * 40.0, 2.0)) * isRing;
  vec4 clip = uProj * (uView * vec4(pos, 1.0));
  vec2 sc = clip.xy / max(clip.w, 0.001);
  vec2 d = sc - uMouse;
  float dl = length(d);
  if (dl > 0.0001) {
    vec2 dc = d * vec2(uAspect, 1.0);
    float f = exp(-dot(dc, dc) * 22.0);
    clip.xy += (d / dl) * f * 0.14 * clip.w;
  }
  gl_Position = clip;
  float w = max(clip.w, 0.4);
  float fogB = exp(-max(0.0, w - 3.0) * 0.22);
  float tw = 0.8 + 0.3 * sin(uTime*1.6 + rnd*40.0);
  float bright = tw * fogB;
  bright *= 1.0 + 1.6*lit;
  bright *= 1.0 + uPulse * exp(-pow((v - uPulseV) * 20.0, 2.0)) * 2.2;
  bright *= 1.0 + isDust * uVel * 1.5;
  bright *= 1.0 + uAudio * (0.3 + 0.9*lit + 1.2*vGate);
  vec3 col = mix(mix(uColA, uColB, clamp(v*2.0, 0.0, 1.0)), uColC, clamp(v*2.0 - 1.0, 0.0, 1.0));
  float hero = isStn * exp(-pow(v * 30.0, 2.0));
  col = mix(col, mix(uColA, uColB, step(pos.x, 0.0)), hero * 0.7);
  /* light theme: focus ring and sparkles darken toward gunmetal ink;
     after hours they lift toward pale signal light instead */
  col = mix(col, ${dark ? 'vec3(0.55, 0.80, 1.00)' : 'vec3(0.04, 0.32, 0.70)'}, 0.5 * lit);
  col = mix(col, ${dark ? 'vec3(0.85, 0.93, 1.00)' : 'vec3(0.06, 0.09, 0.15)'}, 0.85 * step(0.96, rnd));
  vCol = col;
  vA = clamp(bright, 0.0, 2.2) * (0.35 + 0.65 * assemble);
  float roleSz = 1.0 + 0.15 * (1.0 - min(role, 1.0)) - 0.25 * isDust;
  float sz = uSizeMul * (0.9 + rnd*1.9) * roleSz * (1.0 + 0.8*lit) / w;
  gl_PointSize = max(sz, uMinPx);
}`

/* premultiplied-alpha sprite: composited with "over" blending so the
   particles read as ink on the light background */
export const POINT_FS = `
precision mediump float;
varying vec3 vCol; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = exp(-d*d*14.0);
  float halo = 0.40 * exp(-d*d*3.2);
  float a = min((core + halo) * vA, 1.0) * 0.92;
  vec3 col = vCol * (1.0 - 0.25 * smoothstep(0.30, 0.0, d));
  gl_FragColor = vec4(col * a, a);
}`

export const QUAD_VS =
  'attribute vec2 aP; varying vec2 vUv; void main(){ vUv = aP*0.5+0.5; gl_Position = vec4(aP,0.0,1.0); }'

/* background: paper white with faint blue and green pools pulled from
   the logo palette. After hours the paper goes near-black and the
   pools sink into deep signal blue and green. */
export const buildCompFS = (dark: boolean) => `
precision mediump float; varying vec2 vUv;
uniform sampler2D uBloom; uniform float uBloomOn, uStrength, uExposure;
void main(){
  vec3 top = ${dark ? 'vec3(0.043, 0.067, 0.110)' : 'vec3(0.988, 0.992, 0.998)'};
  vec3 bot = ${dark ? 'vec3(0.020, 0.027, 0.047)' : 'vec3(0.922, 0.942, 0.958)'};
  vec3 c = mix(bot, top, vUv.y);
  vec2 p1 = vUv - vec2(0.25, 0.72); c = mix(c, ${dark ? 'vec3(0.075, 0.150, 0.290)' : 'vec3(0.78, 0.88, 0.99)'}, 0.5 * exp(-dot(p1,p1)*5.0));
  vec2 p2 = vUv - vec2(0.78, 0.28); c = mix(c, ${dark ? 'vec3(0.055, 0.180, 0.135)' : 'vec3(0.80, 0.94, 0.87)'}, 0.42 * exp(-dot(p2,p2)*5.0));
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  c += (ign - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(c, 1.0);
}`

export const KAWASE_DOWN_FS = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uOff;
void main(){
  vec2 hp = uTexel * uOff;
  vec4 s = texture2D(uTex, vUv) * 4.0;
  s += texture2D(uTex, vUv - hp);
  s += texture2D(uTex, vUv + hp);
  s += texture2D(uTex, vUv + vec2(hp.x, -hp.y));
  s += texture2D(uTex, vUv - vec2(hp.x, -hp.y));
  gl_FragColor = s / 8.0;
}`

export const KAWASE_UP_FS = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uTexel; uniform float uOff;
void main(){
  vec2 hp = uTexel * uOff;
  vec4 s = texture2D(uTex, vUv + vec2(-hp.x*2.0, 0.0));
  s += texture2D(uTex, vUv + vec2(-hp.x, hp.y)) * 2.0;
  s += texture2D(uTex, vUv + vec2(0.0, hp.y*2.0));
  s += texture2D(uTex, vUv + vec2(hp.x, hp.y)) * 2.0;
  s += texture2D(uTex, vUv + vec2(hp.x*2.0, 0.0));
  s += texture2D(uTex, vUv + vec2(hp.x, -hp.y)) * 2.0;
  s += texture2D(uTex, vUv + vec2(0.0, -hp.y*2.0));
  s += texture2D(uTex, vUv + vec2(-hp.x, -hp.y)) * 2.0;
  gl_FragColor = s / 12.0;
}`
