import { useEffect, useState, type Dispatch } from 'react'
import { buildingById } from '../data/buildings'
import { links } from '../data/links'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import type { JourneyAction, JourneyState } from '../state/journey'
import HowBuilt from './HowBuilt'
import LensOverlay from './LensOverlay'
import VoiceKey from './VoiceKey'

const SAFETY_MS = 15000

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

export default function Finale({ state, dispatch, audio }: { state: JourneyState; dispatch: Dispatch<JourneyAction>; audio: Audio }) {
  const step = state.finale
  const next = () => dispatch({ type: 'FINALE_NEXT' })
  const [howOpen, setHowOpen] = useState(false)
  const wispr = buildingById('B13')
  const palo = buildingById('B04')

  // Fetch the face while the mask is still on, so the crossfade never fades in to nothing.
  useEffect(() => {
    if (step === 'face' && typeof Image === 'function') new Image().src = media('img/F05.jpg')
  }, [step])

  // The unmasking is a timed crossfade from the mask to the real face.
  useEffect(() => {
    if (step !== 'unmasking') return
    const t = setTimeout(next, 2200)
    return () => clearTimeout(t)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === 'swing') audio.sfx('fire')
    if (step === 'face') audio.voice(media('aud/A-F01.mp3'))
    if (step === 'reveal') audio.voice(media('aud/A-F02.mp3'), () => {})
  }, [step, audio])

  return (
    <section className={`finale finale--${step}`}>
      {step === 'swing' && <Clip key="swing" src="vid/F01.mp4" poster="img/O03.jpg" onDone={next} lens />}

      {step === 'face' && (
        <>
          <img className="fill finale__still" src={media('img/F02.jpg')} alt="The masked hero in the maroon jacket, yellow goggles and cream face wrap, on a Mumbai rooftop, facing you" />
          <VoiceKey onUnmask={() => { audio.stopVoice(); dispatch({ type: 'UNMASK' }) }} />
        </>
      )}

      {step === 'unmasking' && (
        <>
          <img className="fill finale__still" src={media('img/F02.jpg')} alt="" />
          <img className="fill finale__unmask" src={media('img/F05.jpg')} alt="" />
        </>
      )}

      {step === 'reveal' && (
        <>
          <img className="fill finale__still" src={media('img/F05.jpg')} alt="Ritwik Mukherjee" />
          <div className="finale__reveal">
            <p className="finale__line">{wispr.built}</p>
            <p className="finale__transcript">{wispr.transcript}</p>
            <button type="button" className="cta" onClick={next}>What I'd do at Wispr</button>
          </div>
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
