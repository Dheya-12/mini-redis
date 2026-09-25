/**
 * Image planes in screen space (orthographic camera, 1 unit = 1 CSS px, origin at the viewport centre, y up).
 *
 * Gallery ("ribbon") deformation — the images travel up the page like a strip of paper:
 *   - below the middle of the screen the strip bows slightly towards the viewer (lower fold);
 *   - from just under the middle it rolls back around a horizontal cylinder (radius = half the viewport height);
 *   - at the very top it folds away once more (exit fold);
 *   each vertex is then projected with a focal length of 1040 px around its own image's centre.
 * Stacking blends every vertex to the base card; the intro draws the first images as waving strips that unfold.
 * Tuning values (pivot, radius, focal length, fold depths) were measured on the original; the formulation is ours.
 */
export const vertexShader = /* glsl */ `
precision highp float;

uniform vec2 uViewport;
uniform vec2 uCenter;       // image centre (base), px
uniform vec2 uSize;         // image size, px
uniform float uFocal;
uniform float uStack;       // 0 = gallery ribbon, 1 = stacked card
uniform float uCornerWave;  // wave travelling from the top-right corner while stacking / focusing
uniform float uPhase;       // per-image phase offset for that wave
uniform float uLift;        // extra depth while stacking (fans the pile)
uniform float uFlat;        // 1 = no ribbon at all (product pages, about cover)
uniform float uIntro;       // per-image unfold, 0..1
uniform float uIntroBlend;  // 0 = intro column, 1 = normal layout
uniform float uIntroCurveY;
uniform float uIntroCurveScale;
uniform float uIntroHeight;

varying vec2 vUv;
varying float vAlpha;

float s5(float t) { t = clamp(t, 0.0, 1.0); return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float ramp(float a, float b, float t) { return s5((t - a) / (b - a)); }

void main() {
  float vh = uViewport.y;
  vec2 base = uCenter + position.xy * uSize;
  float t = base.y / vh + 0.5;                       // 0 = bottom of the screen, 1 = top
  float stackT = s5(uStack);
  float settle = ramp(0.32, 1.0, stackT);            // how far the image has settled onto the card
  float ribbon = (1.0 - settle) * (1.0 - uFlat);

  float y = base.y;
  float z = 0.0;

  // lower fold: the part of the strip below ~40 % of the screen leans towards the viewer
  float fold = s5(1.0 - smoothstep(-0.12, 0.38, t)) * ribbon;
  z += fold * 94.0;
  y -= fold * vh * 0.05;

  // roll back around a cylinder whose axis sits 6 % under the middle of the screen
  float axis = -0.06 * vh;
  float radius = max(72.0, 0.5 * vh);
  float travel = max(0.0, y - axis);
  float roll = s5(smoothstep(0.0, 0.46 * vh, travel)) * ribbon;
  float angle = min(travel / radius, 2.75);
  float rollY = axis + sin(angle) * radius + s5(smoothstep(1.35, 2.7, angle)) * roll * vh * 0.04;
  float rollZ = -(1.0 - cos(angle)) * radius - 42.0;
  y = mix(y, rollY, roll);
  z = mix(z, rollZ, roll);

  // exit fold over the top edge
  float exitT = ramp(0.88, 1.08, t) * ribbon;
  float exitA = 1.45 * ramp(0.88, 1.14, t);
  float exitR = max(52.0, 0.12 * vh);
  y -= sin(exitA) * exitR * 0.28 * exitT;
  z -= ((1.0 - cos(exitA)) * exitR + 24.0) * exitT;

  // the strip narrows a touch as it rolls and shears slightly with its lean
  float localX = position.x * uSize.x * (1.0 - roll * 0.012 - exitT * 0.008);
  float shear = (t - 0.5) * uSize.x * 0.085 * (fold * 0.42 + roll * 2.5);
  float x = uCenter.x + localX + shear;

  // stacking / focus wave from the top-right corner
  float corner = length(vec2(1.0 - uv.x, uv.y) * vec2(0.86, 1.0));
  float phase = stackT * 1.16 - corner;
  float band = max(smoothstep(-0.36, 0.16, phase) * (1.0 - smoothstep(0.32, 1.44, phase)),
                   0.42 * smoothstep(0.0, 0.48, phase) * (1.0 - smoothstep(1.04, 1.96, phase)));
  float wave = band * sin((phase * 3.1 + uPhase * 0.18) * 3.14159265) * uCornerWave * 1.18 * (1.0 - uFlat);

  // blend to the base card
  vec2 card = vec2(uCenter.x + position.x * uSize.x, uCenter.y + position.y * uSize.y);
  x = mix(x, card.x, settle);
  y = mix(y, card.y, settle);
  z = mix(z, 0.0, settle);
  x += wave * uSize.x * 0.032;
  y += wave * uSize.y * 0.046;
  z += wave * uSize.x * 0.05 + uLift * uCornerWave * 0.36;

  float persp = uFocal / max(360.0, uFocal - z);
  vec2 anchor = vec2(uCenter.x, uCenter.y);
  vec2 projected = anchor + (vec2(x, y) - anchor) * persp;

  // intro: a thin strip following an S-curve that unfolds to full width
  float unfold = s5(uIntro);
  float curl = 1.0 - smoothstep(0.18, 0.98, uIntro);
  float cy = uIntroCurveY + position.y * 2.0 * uIntroCurveScale;
  float amp = uIntroHeight * 0.1;
  float ph = cy * 3.35 + 0.55;
  float cx = sin(ph) * (0.72 + 0.28 * cos(cy * 1.5707963)) * curl * amp;
  vec2 tangent = vec2(cos(ph) * 3.35 * curl * amp, uIntroHeight * 0.5 * max(unfold, 0.0001));
  vec2 normal = normalize(vec2(tangent.y, -tangent.x));
  float across = position.x * uSize.x * mix(0.1, 1.0, unfold);
  vec2 intro = uCenter * unfold + vec2(cx, position.y * uSize.y * unfold) + normal * across;
  projected = mix(intro, projected, clamp(uIntroBlend, 0.0, 1.0));
  z = mix(0.0, z, clamp(uIntroBlend, 0.0, 1.0));

  float fade = smoothstep(-0.4, -0.08, t);
  vAlpha = mix(smoothstep(0.0, 0.14, uIntro), mix(fade, 1.0, stackT * 0.98), clamp(uIntroBlend, 0.0, 1.0));
  vAlpha = mix(vAlpha, 1.0, uFlat);

  gl_Position = projectionMatrix * viewMatrix * vec4(projected, z, 1.0);
  vUv = uv;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uCoverScale;   // object-fit: cover
uniform float uReveal;
uniform float uStack;
uniform float uFlat;
varying vec2 vUv;
varying float vAlpha;

void main() {
  vec2 uv = (vUv - 0.5) / uCoverScale + 0.5;
  vec4 color = texture2D(tMap, uv);
  float feather = mix(0.008, 0.0005, max(uFlat, uStack));
  float mask = smoothstep(0.0, feather, vUv.x) * (1.0 - smoothstep(1.0 - feather, 1.0, vUv.x));
  // (the original computes a cylinder shade but never applies it to the colour; neither do we)
  gl_FragColor = vec4(color.rgb, color.a * mask * vAlpha * uReveal);
  #include <colorspace_fragment>
}
`;
