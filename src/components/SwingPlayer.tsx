import { useEffect, useRef, useState } from 'react'
import type { Building } from '../data/buildings'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import LensOverlay from './LensOverlay'

const PUSH_MS = 1200
const STALL_MS = 4000
const REDUCED_MS = 300

type Mode = 'video' | 'push' | 'landed'

const centroid = (pts: [number, number][]) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0])

/**
 * Plays the first-person swing to a building. If the clip is missing, errors, or stalls for 4 s, it falls
 * back to a 2.5D push-in on the hub image. It always calls onEnded exactly once, handing over a canvas
 * holding the last frame for the comic freeze.
 */
export default function SwingPlayer({ building, onEnded, reducedMotion, audio }: {
  building: Building
  onEnded: (lastFrame: HTMLCanvasElement) => void
  reducedMotion: boolean
  audio?: Audio
}) {
  const [mode, setMode] = useState<Mode>(reducedMotion ? 'landed' : building.clip ? 'video' : 'push')
  const [shake, setShake] = useState(!reducedMotion)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const done = useRef(false)

  const finish = (source?: CanvasImageSource) => {
    if (done.current) return
    done.current = true
    const canvas = canvasRef.current!
    try {
      const ctx = canvas.getContext('2d')
      if (ctx && source) {
        canvas.width = 1920
        canvas.height = 1080
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
      }
    } catch {
      /* tainted or not drawable: the freeze falls back to the landing image */
    }
    onEnded(canvas)
  }

  useEffect(() => {
    audio?.sfx('fire')
    const t = setTimeout(() => setShake(false), 140)
    return () => clearTimeout(t)
  }, [audio])

  // A clip that never becomes playable is treated like a missing one.
  useEffect(() => {
    if (mode !== 'video') return
    const t = setTimeout(() => setMode((m) => (m === 'video' ? 'push' : m)), STALL_MS)
    const v = videoRef.current
    const clear = () => clearTimeout(t)
    v?.addEventListener('canplay', clear, { once: true })
    return () => { clearTimeout(t); v?.removeEventListener('canplay', clear) }
  }, [mode])

  useEffect(() => {
    if (mode === 'push') {
      audio?.sfx('whoosh')
      const t = setTimeout(() => setMode('landed'), PUSH_MS)
      return () => clearTimeout(t)
    }
    if (mode === 'landed') {
      const land = () => finish(document.querySelector<HTMLImageElement>('.swing__landing') ?? undefined)
      if (!reducedMotion) return land()
      const t = setTimeout(land, REDUCED_MS)
      return () => clearTimeout(t)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const [cx, cy] = centroid(building.hotspot)

  return (
    <section className="swing">
      {mode === 'video' && building.clip && (
        <video
          ref={videoRef}
          className="fill"
          src={media(building.clip)}
          crossOrigin="anonymous"
          autoPlay
          muted
          playsInline
          onEnded={(e) => finish(e.currentTarget)}
          onError={() => setMode('push')}
        />
      )}
      {mode === 'push' && (
        <img
          className="fill swing__push"
          src={media('img/H01.jpg')}
          alt=""
          style={{ transformOrigin: `${cx}% ${cy}%`, animationDuration: `${PUSH_MS}ms` }}
        />
      )}
      {mode === 'landed' && (
        <img className="fill swing__landing" src={media(building.landing)} crossOrigin="anonymous" alt={`Landing on ${building.name}`} />
      )}
      <canvas ref={canvasRef} data-last-frame className="swing__frame" aria-hidden="true" />
      <LensOverlay visible shake={shake} />
    </section>
  )
}
