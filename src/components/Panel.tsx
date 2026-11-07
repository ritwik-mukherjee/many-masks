import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { districtNames, type Building, type BuildingId } from '../data/buildings'
import { marks } from '../data/marks'
import type { Audio } from '../lib/audio'
import { prefersReducedMotion } from '../lib/device'
import { media } from '../lib/media'
import Mark from './Mark'
import VoicePill from './VoicePill'

/** A building's chapter: its comic panel, what was built, the proof, what cracked, and Ritwik's voice with live captions. */
export default function Panel({ building, onBack, next, onNext, audio }: {
  building: Building
  onBack: () => void
  next?: Building
  onNext?: (id: BuildingId) => void
  audio: Audio
}) {
  const stage = useRef<HTMLElement>(null)
  const [voiceFailed, setVoiceFailed] = useState(false)

  useEffect(() => {
    audio.voice(media(building.voice))
    return () => audio.stopVoice()
  }, [audio, building.voice])

  // The art and the card shift against each other with the cursor, so the panel has a little depth.
  const onMove = (e: MouseEvent) => {
    const el = stage.current
    if (!el || prefersReducedMotion()) return
    el.style.setProperty('--mx', String((e.clientX / innerWidth - 0.5) * 2))
    el.style.setProperty('--my', String((e.clientY / innerHeight - 0.5) * 2))
  }

  const voiceName = building.voice.replace(/^.*\/|\.mp3$/g, '')

  return (
    <section ref={stage} className={`panel panel--${building.district}`} onMouseMove={onMove}>
      <img className="fill panel__art" src={media(building.panel)} alt={`Comic panel: ${building.name}`} />
      <article className="panel__card">
        <p className="panel__district">{districtNames[building.district]}</p>
        <h2 className="panel__name">{building.name}</h2>
        {building.marks && (
          <ul className="panel__marks">
            {building.marks.map((name) => (
              <li key={name}><Mark mark={marks[name]} /> {marks[name].label}</li>
            ))}
          </ul>
        )}
        <div className="panel__block">
          <h3>What I built</h3>
          <p>{building.built}</p>
        </div>
        <div className="panel__block panel__block--proof">
          <h3>Proof</h3>
          <p>{building.proof}</p>
        </div>
        {building.cracked && (
          <div className="panel__block panel__block--cracked">
            <h3>What cracked</h3>
            <p>{building.cracked}</p>
          </div>
        )}
        {building.more && (
          <div className="panel__block panel__more">
            <h3>{building.moreTitle ?? 'Also on this line'}</h3>
            <ul>
              {building.more.map((m) => (
                <li key={m.name}>
                  <strong>{m.url ? <a href={m.url} target="_blank" rel="noreferrer">{m.name}</a> : m.name}</strong>
                  <p>{m.note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <details className="panel__voice" open={voiceFailed}>
          <summary>Read it in my words</summary>
          <blockquote>{building.transcript}</blockquote>
        </details>
        <div className="panel__actions">
          {next && onNext && (
            <button type="button" className="cta panel__next" onClick={() => onNext(next.id)}>Next: {next.id === 'B13' ? 'Wispr Flow' : next.name}</button>
          )}
          <button type="button" className={next && onNext ? 'panel__back' : 'cta panel__back'} onClick={onBack}>Back to the city</button>
        </div>
      </article>
      <div className="panel__live">
        <VoicePill name={voiceName} text={building.transcript} audio={audio} onUnavailable={() => setVoiceFailed(true)} />
      </div>
    </section>
  )
}
