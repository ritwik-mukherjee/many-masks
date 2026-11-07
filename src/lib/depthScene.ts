/**
 * Real parallax for the skyline: a WebGL picture displaced by a depth map, so near rooftops move against far towers.
 * Depth 1 is nearest. Everything shifts around the PIVOT depth, which stays still.
 */
export const PIVOT = 0.35

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = vec2((aPos.x + 1.0) / 2.0, 1.0 - (aPos.y + 1.0) / 2.0); gl_Position = vec4(aPos, 0.0, 1.0); }`

// Refines the lookup a few times, so edges between near and far hold together rather than smearing.
const FRAG = `precision mediump float;
uniform sampler2D uColor; uniform sampler2D uDepth; uniform vec2 uShift; varying vec2 vUv;
const float PIVOT = ${PIVOT.toFixed(2)};
void main() {
  float d = texture2D(uDepth, vUv).r;
  for (int i = 0; i < 4; i++) d = texture2D(uDepth, vUv - uShift * (d - PIVOT)).r;
  gl_FragColor = texture2D(uColor, vUv - uShift * (d - PIVOT));
}`

/** Returns draw(shiftX, shiftY), in fractions of the picture, and dispose, or null if WebGL can't do it. */
export function createDepthScene(canvas: HTMLCanvasElement, color: HTMLImageElement, depth: HTMLImageElement): { draw: (x: number, y: number) => void; dispose: () => void } | null {
  try {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) as WebGLRenderingContext | null
    if (!gl) return null
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader')
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const texture = (unit: number, image: HTMLImageElement, name: string) => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
      for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, wrap, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      gl.uniform1i(gl.getUniformLocation(prog, name), unit)
    }
    texture(0, color, 'uColor')
    texture(1, depth, 'uDepth')
    canvas.width = color.naturalWidth
    canvas.height = color.naturalHeight
    gl.viewport(0, 0, canvas.width, canvas.height)
    const uShift = gl.getUniformLocation(prog, 'uShift')
    return {
      draw: (x, y) => {
        gl.uniform2f(uShift, x, y)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      },
      dispose: () => gl.getExtension('WEBGL_lose_context')?.loseContext(),
    }
  } catch {
    return null
  }
}

/** Reads a function that gives the depth, 0 to 1, at a point in percent of the picture. Null if it can't be read. */
export function depthReader(depth: HTMLImageElement): ((xPercent: number, yPercent: number) => number) | null {
  try {
    const w = 256
    const h = Math.round((w * depth.naturalHeight) / depth.naturalWidth)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(depth, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    return (x, y) => {
      const px = Math.max(0, Math.min(w - 1, Math.round((x / 100) * (w - 1))))
      const py = Math.max(0, Math.min(h - 1, Math.round((y / 100) * (h - 1))))
      return data[(py * w + px) * 4] / 255
    }
  } catch {
    return null
  }
}
