import { useEffect, useRef, useState } from 'react'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import fragSource from '../shaders/comic.frag?raw'

const INK_MS = 900
const FADE_MS = 400
const REDUCED_MS = 400

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = vec2((aPos.x + 1.0) / 2.0, 1.0 - (aPos.y + 1.0) / 2.0); gl_Position = vec4(aPos, 0.0, 1.0); }`

/** Sets up the comic shader on `canvas` for `source`. Returns a draw(progress) function, or null without WebGL. */
function setupInk(canvas: HTMLCanvasElement, source: HTMLCanvasElement): ((p: number) => void) | null {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) as WebGLRenderingContext | null
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  try {
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSource))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    canvas.width = source.width
    canvas.height = source.height
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(gl.getUniformLocation(prog, 'uResolution'), canvas.width, canvas.height)
    const uProgress = gl.getUniformLocation(prog, 'uProgress')
    return (p: number) => {
      gl.uniform1f(uProgress, p)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
  } catch {
    return null
  }
}

/**
 * The landing moment: the last swing frame inks over into comic art (900 ms), then crossfades into the
 * generated comic panel (400 ms). Without WebGL it uses a CSS filter instead; reduced motion just crossfades.
 */
export default function ComicFreeze({ source, panelSrc, onDone, reducedMotion, audio }: {
  source: HTMLCanvasElement
  panelSrc: string
  onDone: () => void
  reducedMotion: boolean
  audio?: Audio
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'gl' | 'css' | 'reduced'>(() => {
    if (reducedMotion) return 'reduced'
    try {
      return document.createElement('canvas').getContext('webgl') ? 'gl' : 'css'
    } catch {
      return 'css'
    }
  })
  const [panelOn, setPanelOn] = useState(false)
  const [inkOn, setInkOn] = useState(false)

  useEffect(() => {
    if (mode !== 'reduced') audio?.sfx('ink')
    if (mode === 'reduced') {
      setPanelOn(true)
      const t = setTimeout(onDone, REDUCED_MS)
      return () => clearTimeout(t)
    }
    let raf = 0
    const start = performance.now()
    const draw = mode === 'gl' && canvasRef.current ? setupInk(canvasRef.current, source) : null
    if (draw) {
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / INK_MS)
        draw(p * p * (3 - 2 * p))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    } else {
      // No WebGL, or the shader failed to compile on this GPU: use the CSS ink instead of a blank canvas.
      if (mode === 'gl') setMode('css')
      setInkOn(true)
    }
    const t1 = setTimeout(() => setPanelOn(true), INK_MS)
    const t2 = setTimeout(onDone, INK_MS + FADE_MS + 100)
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={`freeze freeze--${mode}`}>
      {mode === 'gl' && <canvas ref={canvasRef} className="fill freeze__canvas" />}
      {mode === 'css' && (
        <canvas
          className={`fill freeze__canvas${inkOn ? ' is-inked' : ''}`}
          ref={(c) => {
            if (!c || c.dataset.copied) return
            c.dataset.copied = '1'
            c.width = source.width || 1
            c.height = source.height || 1
            try { c.getContext('2d')?.drawImage(source, 0, 0) } catch { /* nothing to copy */ }
          }}
        />
      )}
      <img className={`fill freeze__panel${panelOn ? ' is-on' : ''}`} src={media(panelSrc)} alt="" />
    </section>
  )
}
