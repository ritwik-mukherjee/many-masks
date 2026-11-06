import { useEffect, useState, type Dispatch } from 'react'
import { buildings, type Building, type BuildingId } from '../data/buildings'
import { rooftopDetails } from '../data/links'
import { coverTransform } from '../lib/cover'
import { media } from '../lib/media'
import type { JourneyAction } from '../state/journey'
import RouteMap from './RouteMap'

// H01's aspect (the chat copy is 1672x941, the original 3344x1882): hotspots are in percent, so only the ratio matters.
const IMG = { w: 3344, h: 1882 }

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const go = (b: Building) => dispatch({ type: 'CLICK_BUILDING', id: b.id })
  const box = { left: offsetX, top: offsetY, width: IMG.w * scale, height: IMG.h * scale }

  return (
    <section
      className="hub"
      onMouseMove={(e) => { if (!reducedMotion) setTilt({ x: (e.clientX / view.w - 0.5) * 2, y: (e.clientY / view.h - 0.5) * 2 }) }}
    >
      <div className="hub__world" style={{ ...box, transform: `translate(${-tilt.x * 1}%, ${-tilt.y * 0.6}%) scale(1.03)` }}>
        <img className="hub__img" src={media('img/H01.jpg')} alt="The Mumbai skyline at golden hour seen from a rooftop, with the buildings of Ritwik's work" />
        <svg className="hub__svg" viewBox={`0 0 ${IMG.w} ${IMG.h}`} data-testid="hotspots">
          <text className="hub__billboard" x={(65.65 / 100) * IMG.w} y={(25.2 / 100) * IMG.h} textAnchor="middle">220,000+</text>
          {buildings.map((b) => (
            <polygon
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label={b.name}
              className={`hub__spot${b.id === 'B13' ? ' hub__spot--wispr' : ''}${visited.includes(b.id) ? ' is-visited' : ''}${hovered?.id === b.id ? ' is-hot' : ''}`}
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
              style={{ left: `${b.marker.at[0]}%`, top: `${b.marker.at[1]}%`, animationDelay: `${500 + i * 45}ms` }}
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
            style={{ left: `${hovered.marker.at[0]}%`, top: `${hovered.marker.at[1]}%` }}
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
