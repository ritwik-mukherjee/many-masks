import { useEffect, useRef, useState, type CSSProperties, type Dispatch } from 'react'
import { buildings, type Building, type BuildingId } from '../data/buildings'
import { rooftopDetails } from '../data/links'
import { coverTransform } from '../lib/cover'
import { createDepthScene, depthReader, PIVOT } from '../lib/depthScene'
import { media } from '../lib/media'
import type { JourneyAction } from '../state/journey'
import RouteMap from './RouteMap'

// H01's aspect (the chat copy is 1672x941, the original 3344x1882): hotspots are in percent, so only the ratio matters.
const IMG = { w: 3344, h: 1882 }
/** How far the nearest rooftop moves, as a fraction of the picture, with the cursor at the screen's edge. */
const SHIFT_X = 0.022
const SHIFT_Y = 0.012
const BILLBOARD = { x: 65.65, y: 22 }
/** The Wispr tower on the horizon. */
const BEACON = { x: 93, y: 29.5 }

const centre = (pts: [number, number][]) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0])

function useViewport() {
  const read = () => ({ w: typeof innerWidth === 'number' ? innerWidth : 1440, h: typeof innerHeight === 'number' ? innerHeight : 900 })
  const [view, setView] = useState(read)
  useEffect(() => {
    const on = () => setView(read())
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return view
}

// Chrome ignores <link rel="preload" as="video">, so a held, detached video element does the warming.
const warmed = new Map<string, HTMLVideoElement>()

function preload(b: Building) {
  if (typeof document === 'undefined') return
  if (typeof Image === 'function') {
    new Image().src = media(b.landing)
    new Image().src = media(b.panel)
  }
  if (!b.clip) return
  const href = media(b.clip)
  if (warmed.has(href)) return
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'auto'
  video.src = href
  warmed.set(href, video)
}

export default function Hub({ dispatch, visited, reducedMotion = false }: { dispatch: Dispatch<JourneyAction>; visited: BuildingId[]; reducedMotion?: boolean }) {
  const view = useViewport()
  const { scale, offsetX, offsetY } = coverTransform(IMG, view)
  const [hovered, setHovered] = useState<Building | null>(null)
  const world = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const [depthAt, setDepthAt] = useState<((x: number, y: number) => number) | null>(null)

  // Everything floats by its own depth: the picture in the shader, and the tags and buildings through --sx and --sy.
  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let dead = false
    let dispose = () => {}
    const color = new Image()
    const depth = new Image()
    color.crossOrigin = 'anonymous'
    depth.crossOrigin = 'anonymous'
    const start = () => {
      if (dead || !color.complete || !depth.complete || !color.naturalWidth || !depth.naturalWidth || !canvas.current) return
      const scene = createDepthScene(canvas.current, color, depth)
      if (!scene) return
      dispose = scene.dispose
      canvas.current.classList.add('is-on')
      setDepthAt(() => depthReader(depth))
      let x = 0
      let y = 0
      const opened = performance.now()
      const tick = (now: number) => {
        // A slow drift keeps the city alive when the cursor is still.
        const t = (now - opened) / 1000
        const goalX = target.current.x + Math.sin(t * 0.35) * 0.18
        const goalY = target.current.y + Math.cos(t * 0.27) * 0.12
        x += (goalX - x) * 0.06
        y += (goalY - y) * 0.06
        const sx = -x * SHIFT_X
        const sy = -y * SHIFT_Y
        scene.draw(sx, sy)
        const el = world.current
        if (el) {
          el.style.setProperty('--sx', `${sx * el.offsetWidth}px`)
          el.style.setProperty('--sy', `${sy * el.offsetHeight}px`)
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    color.onload = start
    depth.onload = start
    color.src = media('img/H01.jpg')
    depth.src = media('img/H01-depth.jpg')
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      dispose()
    }
  }, [reducedMotion])

  const float = (x: number, y: number): CSSProperties => ({ '--d': depthAt ? depthAt(x, y) - PIVOT : 0 }) as CSSProperties

  const go = (b: Building) => dispatch({ type: 'CLICK_BUILDING', id: b.id })
  const box = { left: offsetX, top: offsetY, width: IMG.w * scale, height: IMG.h * scale }

  return (
    <section
      className="hub"
      onMouseMove={(e) => { target.current = { x: (e.clientX / view.w - 0.5) * 2, y: (e.clientY / view.h - 0.5) * 2 } }}
    >
      <div ref={world} className="hub__world" style={box}>
        <img className="hub__img" src={media('img/H01.jpg')} alt="The Mumbai skyline at golden hour seen from a rooftop, with the buildings of Ritwik's work" />
        <canvas ref={canvas} className="hub__scene" aria-hidden="true" />
        <span className="hub__beacon" aria-hidden="true" style={{ left: `${BEACON.x}%`, top: `${BEACON.y}%`, ...float(BEACON.x, BEACON.y) }}><i /><i /><i /></span>
        <svg className="hub__svg" viewBox={`0 0 ${IMG.w} ${IMG.h}`} data-testid="hotspots">
          <text className="hub__billboard" style={float(BILLBOARD.x, BILLBOARD.y)} x={(65.65 / 100) * IMG.w} y={(25.2 / 100) * IMG.h} textAnchor="middle">220,000+</text>
          {buildings.map((b) => (
            <polygon
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label={b.name}
              className={`hub__spot${b.id === 'B13' ? ' hub__spot--wispr' : ''}${visited.includes(b.id) ? ' is-visited' : ''}${hovered?.id === b.id ? ' is-hot' : ''}`}
              style={float(centre(b.hotspot)[0], centre(b.hotspot)[1])}
              points={b.hotspot.map(([x, y]) => `${(x / 100) * IMG.w},${(y / 100) * IMG.h}`).join(' ')}
              onMouseEnter={() => { setHovered(b); preload(b) }}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => { setHovered(b); preload(b) }}
              onBlur={() => setHovered(null)}
              onClick={() => go(b)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(b) } }}
            />
          ))}
        </svg>
        {/* The polygons already carry each name for keyboards and screen readers, so the tags are for the eye and the mouse. */}
        <div className="hub__markers" aria-hidden="true">
          {buildings.map((b, i) => (
            <button
              key={b.id}
              type="button"
              tabIndex={-1}
              className={`hub__marker${b.id === 'B13' ? ' hub__marker--wispr' : ''}${b.marker.align === 'end' ? ' hub__marker--end' : ''}${visited.includes(b.id) ? ' is-visited' : ''}${hovered?.id === b.id ? ' is-hot' : ''}`}
              style={{ left: `${b.marker.at[0]}%`, top: `${b.marker.at[1]}%`, animationDelay: `${500 + i * 45}ms`, ...float(b.marker.at[0], b.marker.at[1] + 2) }}
              onMouseEnter={() => { setHovered(b); preload(b) }}
              onMouseLeave={() => setHovered(null)}
              onClick={() => go(b)}
            >
              {b.marker.label}
            </button>
          ))}
        </div>
        {hovered && (
          <div
            className={`hub__tip${hovered.marker.at[1] < 32 ? ' hub__tip--below' : ''}${hovered.marker.align === 'end' ? ' hub__tip--end' : ''}`}
            style={{ left: `${hovered.marker.at[0]}%`, top: `${hovered.marker.at[1]}%`, ...float(hovered.marker.at[0], hovered.marker.at[1] + 2) }}
          >
            <strong>{hovered.name}</strong>
            <span>{hovered.hook}</span>
          </div>
        )}
      </div>
      <header className="hub__head">
        <p className="hub__title">Pick a building. Fire a line.</p>
        <p className="hub__sub">The glow on the horizon is where this ends.</p>
      </header>
      <RouteMap dispatch={dispatch} visited={visited} defaultOpen={false} />
      {reducedMotion ? (
        <ul className="hub__details" aria-label="Also on the skyline">
          {rooftopDetails.map((d) => <li key={d}>{d}</li>)}
        </ul>
      ) : (
        <p className="hub__ticker">
          <span className="visually-hidden">Also on the skyline: </span>
          <span aria-hidden="true">{[...rooftopDetails, ...rooftopDetails].join('   ·   ')}</span>
          <span className="visually-hidden">{rooftopDetails.join(', ')}</span>
        </p>
      )}
    </section>
  )
}
