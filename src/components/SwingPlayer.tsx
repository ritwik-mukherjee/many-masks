import { useEffect, useRef, useState } from 'react'
import type { Building } from '../data/buildings'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import LensOverlay from './LensOverlay'
import ManagedVideo from './ManagedVideo'

const PUSH_MS = 1200
const STALL_MS = 4000
const REDUCED_MS = 300
const LANDING_MS = 2500
const DEADLINE_PAD_MS = 2000

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

  // A clip that never becomes playable is treated like a missing one. One that is already playable
  // (cached revisit) is left alone. Once its length is known, it must finish by duration + 2 s even if
  // the network stalls mid-clip or autoplay is refused.
  useEffect(() => {
    if (mode !== 'video') return
    const v = videoRef.current
    let deadline: ReturnType<typeof setTimeout> | undefined
    const stall = setTimeout(() => setMode((m) => (m === 'video' ? 'push' : m)), STALL_MS)
    const clear = () => clearTimeout(stall)
    const arm = () => {
      if (!v || !Number.isFinite(v.duration) || deadline) return
      deadline = setTimeout(() => setMode('landed'), v.duration * 1000 + DEADLINE_PAD_MS)
    }
    if (v && v.readyState >= 3) clear()
    v?.addEventListener('canplay', clear, { once: true })
    v?.addEventListener('loadedmetadata', arm)
    arm()
    return () => {
      clearTimeout(stall)
      if (deadline) clearTimeout(deadline)
      v?.removeEventListener('canplay', clear)
      v?.removeEventListener('loadedmetadata', arm)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'push') {
      audio?.sfx('whoosh')
      const t = setTimeout(() => setMode('landed'), PUSH_MS)
      return () => clearTimeout(t)
    }
    if (mode === 'landed') {
      // The landing image is drawn into the freeze only once it has loaded (onLoad below); if it fails or
      // never loads, end anyway with no frame, and the freeze goes straight to the panel.
      const t = setTimeout(() => finish(), reducedMotion ? REDUCED_MS : LANDING_MS)
      return () => clearTimeout(t)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const [cx, cy] = centroid(building.hotspot)

  return (
    <section className="swing">
      {mode === 'video' && building.clip && (
        <ManagedVideo
          videoRef={videoRef}
          className="fill"
          src={media(building.clip)}
          crossOrigin="anonymous"
          autoStart
          autoPlay
          muted
          playsInline
          onEnded={() => { if (building.landsOnClip) finish(videoRef.current ?? undefined); else setMode('landed') }}
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
        <img
          className="fill swing__landing"
          src={media(building.landing)}
          crossOrigin="anonymous"
          alt={`Landing on ${building.name}`}
          onLoad={(e) => { if (!reducedMotion) finish(e.currentTarget) }}
          onError={() => finish()}
        />
      )}
      <canvas ref={canvasRef} data-last-frame className="swing__frame" aria-hidden="true" />
      <LensOverlay visible shake={shake} />
    </section>
  )
}
