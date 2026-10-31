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

function preload(b: Building) {
  if (!b.clip || typeof document === 'undefined') return
  const href = media(b.clip)
  if (document.head.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'video'
  link.href = href
  document.head.appendChild(link)
}

const centroid = (pts: [number, number][]) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0])

export default function Hub({ dispatch, visited }: { dispatch: Dispatch<JourneyAction>; visited: BuildingId[] }) {
  const view = useViewport()
  const { scale, offsetX, offsetY } = coverTransform(IMG, view)
  const [hovered, setHovered] = useState<Building | null>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const go = (b: Building) => dispatch({ type: 'CLICK_BUILDING', id: b.id })
  const box = { left: offsetX, top: offsetY, width: IMG.w * scale, height: IMG.h * scale }
  const tip = hovered ? centroid(hovered.hotspot) : null

  return (
    <section
      className="hub"
      onMouseMove={(e) => setTilt({ x: (e.clientX / view.w - 0.5) * 2, y: (e.clientY / view.h - 0.5) * 2 })}
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
              className={`hub__spot${b.id === 'B13' ? ' hub__spot--wispr' : ''}${visited.includes(b.id) ? ' is-visited' : ''}`}
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
        {hovered && tip && (
          <div className="hub__tip" style={{ left: `${tip[0]}%`, top: `${tip[1]}%` }}>
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
      <p className="hub__ticker" aria-label="Also on the skyline">
        <span>{[...rooftopDetails, ...rooftopDetails].join('   ·   ')}</span>
      </p>
    </section>
  )
}
