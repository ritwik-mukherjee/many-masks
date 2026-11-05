import { useEffect, useRef, useState, type Dispatch } from 'react'
import { openingBeats } from '../data/opening'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import { scrollToTime, shouldSeek } from '../lib/scrub'
import type { JourneyAction } from '../state/journey'
import ComicFreeze from './ComicFreeze'
import LensOverlay from './LensOverlay'

type Props = { dispatch: Dispatch<JourneyAction>; reducedMotion: boolean }

/** The push-in on the mask (O02), played once after "Put it on". */
export function Intro({ dispatch, reducedMotion }: Props) {
  const [lensOn, setLensOn] = useState(false)

  useEffect(() => {
    if (!reducedMotion) return
    const t = setTimeout(() => dispatch({ type: 'INTRO_DONE' }), 300)
    return () => clearTimeout(t)
  }, [dispatch, reducedMotion])

  return (
    <section className="intro">
      {!reducedMotion && (
        <video
          className="fill"
          src={media('vid/O02.mp4')}
          poster={media('img/O01.jpg')}
          autoPlay
          muted
          playsInline
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            if (v.duration && v.currentTime > v.duration - 1.2) setLensOn(true)
          }}
          onEnded={() => dispatch({ type: 'INTRO_DONE' })}
          onError={() => dispatch({ type: 'INTRO_DONE' })}
        />
      )}
      <LensOverlay visible={lensOn} />
      <button type="button" className="skip" onClick={() => dispatch({ type: 'SKIP_INTRO' })}>Skip intro</button>
    </section>
  )
}

/** The guided opening: scrolling scrubs the Thane swing, the drop-year fall and the SPIT landing. */
export default function Opening({ dispatch, audio, reducedMotion }: Props & { audio: Audio }) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)
  const [landed, setLanded] = useState(false)
  const [frame, setFrame] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (reducedMotion) return
    let target = 0
    let shown = 0
    let lastScroll = scrollY
    let raf = 0
    const read = () => {
      const el = sectionRef.current
      if (!el) return
      const total = el.offsetHeight - innerHeight
      target = total > 0 ? (scrollY - el.offsetTop) / total : 0
    }
    const tick = () => {
      shown += (target - shown) * 0.15
      const v = videoRef.current
      if (v && v.duration) {
        const t = scrollToTime(shown, v.duration)
        if (shouldSeek(v.currentTime, t, v.seeking)) v.currentTime = t
      }
      const p = Math.max(0, Math.min(1, shown))
      setProgress((prev) => (Math.abs(prev - p) > 0.002 ? p : prev))
      const speed = Math.abs(scrollY - lastScroll)
      lastScroll = scrollY
      audio.ambient('wind', Math.min(1, speed / 60))
      if (shown > 0.995) setLanded(true)
      raf = requestAnimationFrame(tick)
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    raf = requestAnimationFrame(tick)
    return () => {
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
      cancelAnimationFrame(raf)
      audio.ambient('wind', 0)
    }
  }, [audio, reducedMotion])

  useEffect(() => {
    if (!landed) return
    const c = document.createElement('canvas')
    const v = videoRef.current
    c.width = 1920
    c.height = 1080
    try { if (v) c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height) } catch { /* not drawable */ }
    setFrame(c)
    audio.voice(media('aud/A-P00.mp3'))
  }, [landed, audio])

  const skip = (
    <button type="button" className="skip" onClick={() => dispatch({ type: 'SKIP_INTRO' })}>Skip intro</button>
  )

  if (reducedMotion) {
    return (
      <section className="opening opening--stepped">
        <img className="fill" src={media('img/P00.jpg')} alt="Comic panel: an empty college terrace at sunrise, looking out over the city" />
        <ol className="opening__steps">
          {openingBeats.map((b) => (
            <li key={b.text}><span className="caption">{b.text}</span></li>
          ))}
        </ol>
        <button type="button" className="cta" onClick={() => dispatch({ type: 'OPENING_DONE' })}>Into the city</button>
        {skip}
      </section>
    )
  }

  const beat = openingBeats.find((b) => progress >= b.from && progress < b.to) ?? openingBeats.at(-1)!

  return (
    <section ref={sectionRef} className="opening" style={{ height: '900vh' }}>
      <div className="opening__stage">
        <video ref={videoRef} className="fill" src={media('vid/opening.mp4')} poster={media('img/O03.jpg')} muted playsInline preload="auto" crossOrigin="anonymous" />
        {frame && <ComicFreeze source={frame} panelSrc="img/P00.jpg" audio={audio} reducedMotion={false} onDone={() => {}} />}
        <LensOverlay visible={!landed} />
        <p className="opening__beat" key={beat.text}><span className="caption">{beat.text}</span></p>
        {!landed && progress < 0.02 && <p className="opening__hint">Scroll to swing</p>}
        {landed && (
          <button type="button" className="cta opening__next" onClick={() => dispatch({ type: 'OPENING_DONE' })}>
            Into the city
          </button>
        )}
        {skip}
      </div>
    </section>
  )
}
