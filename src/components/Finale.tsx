import { useEffect, useRef, useState, type Dispatch } from 'react'
import { buildingById } from '../data/buildings'
import { links } from '../data/links'
import { rawClipCaptions } from '../data/rawClip'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import type { JourneyAction, JourneyState } from '../state/journey'
import HowBuilt from './HowBuilt'
import LensOverlay from './LensOverlay'
import VoiceKey from './VoiceKey'

const SAFETY_MS = 15000
/** A-F01 runs about 4 s and says "take it off" itself, so the mic waits for it to finish. */
const PROMPT_MS = 4500

/** A video step that always moves on: when it ends, errors, or never finishes. */
function Clip({ src, poster, onDone, lens = false }: { src: string; poster: string; onDone: () => void; lens?: boolean }) {
  useEffect(() => {
    const t = setTimeout(onDone, SAFETY_MS)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <>
      <video className="fill" src={media(src)} poster={media(poster)} autoPlay muted playsInline onEnded={onDone} onError={onDone} />
      {lens && <LensOverlay visible />}
    </>
  )
}

/**
 * The real person after all the CGI: his raw clip, with sound and captions. If it can't play, the photo and
 * recorded line take over. If the browser refuses sound, it plays muted and the captions carry it.
 */
function RawClip({ finished, onFinished, onFailed }: { finished: boolean; onFinished: () => void; onFailed: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [time, setTime] = useState(0)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    try {
      Promise.resolve(v.play()).catch(() => {
        v.muted = true
        Promise.resolve(v.play()).catch(() => {})
      })
    } catch {
      /* not supported here: onError or the Skip button moves things on */
    }
  }, [])

  const caption = rawClipCaptions.find((c) => time >= c.from && time < c.to)
  return (
    <>
      <video
        ref={ref}
        className={`fill finale__raw${finished ? ' finale__raw--ended' : ''}`}
        src={media('vid/raw.mp4')}
        playsInline
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={onFinished}
        onError={onFailed}
      />
      {caption && !finished && <p className="finale__caption" key={caption.text}><span className="caption">{caption.text}</span></p>}
    </>
  )
}

export default function Finale({ state, dispatch, audio }: { state: JourneyState; dispatch: Dispatch<JourneyAction>; audio: Audio }) {
  const step = state.finale
  const next = () => dispatch({ type: 'FINALE_NEXT' })
  const [howOpen, setHowOpen] = useState(false)
  const [clip, setClip] = useState<'playing' | 'ended' | 'failed'>('playing')
  const wispr = buildingById('B13')
  const palo = buildingById('B04')

  // Load the pull-off and his clip while the mask is still on, so neither stalls at the big moment.
  const warmed = useRef<HTMLVideoElement[]>([])
  useEffect(() => {
    if (step !== 'face' || typeof document === 'undefined') return
    warmed.current = ['vid/F03.mp4', 'vid/raw.mp4'].map((src) => {
      const v = document.createElement('video')
      v.muted = true
      v.preload = 'auto'
      v.src = media(src)
      return v
    })
  }, [step])

  useEffect(() => {
    if (step === 'swing') audio.sfx('fire')
    if (step === 'face') audio.voice(media('aud/A-F01.mp3'))
    if (step === 'unmasking') audio.sfx('whoosh')
  }, [step, audio])

  // Only if his clip can't play does the recorded line stand in for it.
  useEffect(() => {
    if (step === 'reveal' && clip === 'failed') audio.voice(media('aud/A-F02.mp3'))
  }, [step, clip, audio])

  return (
    <section className={`finale finale--${step}`}>
      {step === 'swing' && <Clip key="swing" src="vid/F01.mp4" poster="img/O03.jpg" onDone={next} lens />}

      {step === 'face' && (
        <>
          <img className="fill" src={media('img/F02.jpg')} alt="The masked hero in the maroon jacket, yellow goggles and cream face wrap, on a Mumbai rooftop, facing you" />
          <VoiceKey listenAfterMs={PROMPT_MS} onUnmask={() => { audio.stopVoice(); dispatch({ type: 'UNMASK' }) }} />
        </>
      )}

      {step === 'unmasking' && <Clip key="unmask" src="vid/F03.mp4" poster="img/F02.jpg" onDone={next} />}

      {step === 'reveal' && (
        <>
          {clip === 'failed' ? (
            <img className="fill finale__still" src={media('img/F05.jpg')} alt="Ritwik Mukherjee" />
          ) : (
            <RawClip finished={clip === 'ended'} onFinished={() => setClip('ended')} onFailed={() => setClip('failed')} />
          )}
          {clip === 'playing' ? (
            <button type="button" className="skip" onClick={next}>Skip</button>
          ) : (
            <div className={`finale__reveal${clip === 'ended' ? ' finale__reveal--side' : ''}`}>
              <p className="finale__line">{wispr.built}</p>
              {clip === 'failed' && <p className="finale__transcript">{wispr.transcript}</p>}
              <button type="button" className="cta" onClick={next}>What I'd do at Wispr</button>
            </div>
          )}
        </>
      )}

      {step === 'growth' && (
        <div className="finale__growth">
          <p className="finale__kicker">The one I want next</p>
          <h2>Growing Wispr Flow in India</h2>
          <div className="finale__plan">
            <p>{wispr.proof}</p>
          </div>
          <div className="finale__proof">
            <h3>I've done this before, remotely</h3>
            <p>{palo.built}</p>
            <p><strong>{palo.proof}</strong></p>
          </div>
          <ul className="finale__links">
            <li><a href={`mailto:${links.email}`}>{links.email}</a></li>
            {links.linkedin && <li><a href={links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>}
            <li><a href={links.github} target="_blank" rel="noreferrer">GitHub</a></li>
            {links.resume && <li><a href={links.resume} target="_blank" rel="noreferrer">Resume</a></li>}
          </ul>
          <div className="finale__actions">
            <button type="button" className="finale__how" onClick={() => setHowOpen(true)}>How this was built</button>
            <button type="button" className="finale__how" onClick={() => { audio.sfx('whoosh'); dispatch({ type: 'BACK_TO_CITY' }) }}>Back to the city</button>
          </div>
          {howOpen && <HowBuilt onClose={() => setHowOpen(false)} />}
        </div>
      )}
    </section>
  )
}
