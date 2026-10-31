precision mediump float;

uniform sampler2D uFrame;
uniform float uProgress;   // 0 = the photo, 1 = full comic ink
uniform vec2 uResolution;
varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 px = 1.0 / uResolution;
  vec3 src = texture2D(uFrame, vUv).rgb;

  // Sobel edges become black ink lines.
  float tl = luma(texture2D(uFrame, vUv + px * vec2(-1.0, -1.0)).rgb);
  float t  = luma(texture2D(uFrame, vUv + px * vec2( 0.0, -1.0)).rgb);
  float tr = luma(texture2D(uFrame, vUv + px * vec2( 1.0, -1.0)).rgb);
  float l  = luma(texture2D(uFrame, vUv + px * vec2(-1.0,  0.0)).rgb);
  float r  = luma(texture2D(uFrame, vUv + px * vec2( 1.0,  0.0)).rgb);
  float bl = luma(texture2D(uFrame, vUv + px * vec2(-1.0,  1.0)).rgb);
  float b  = luma(texture2D(uFrame, vUv + px * vec2( 0.0,  1.0)).rgb);
  float br = luma(texture2D(uFrame, vUv + px * vec2( 1.0,  1.0)).rgb);
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  float edge = smoothstep(0.18, 0.32, length(vec2(gx, gy)));

  // Slight red/cyan print misregistration, 2 px.
  vec3 shifted = vec3(
    texture2D(uFrame, vUv + px * vec2(2.0, 0.0)).r,
    src.g,
    texture2D(uFrame, vUv - px * vec2(2.0, 0.0)).b
  );

  // Flat colour: posterize to 5 levels.
  vec3 poster = floor(shifted * 5.0 + 0.5) / 5.0;

  // Halftone dots on a 7 px grid rotated 15 degrees; darker areas get bigger dots.
  float a = radians(15.0);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 cell = rot * (vUv * uResolution) / 7.0;
  vec2 f = fract(cell) - 0.5;
  float radius = (1.0 - luma(poster)) * 0.62;
  float dotMask = 1.0 - smoothstep(radius - 0.08, radius, length(f));
  vec3 inked = mix(poster, poster * 0.55, dotMask * 0.85);

  inked = mix(inked, vec3(0.055), edge);
  gl_FragColor = vec4(mix(src, inked, uProgress), 1.0);
}
