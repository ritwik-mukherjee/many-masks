import { useEffect } from 'react'
import { districtNames, type Building } from '../data/buildings'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'

/** A building's chapter: its comic panel, what was built, the proof, what cracked, and Ritwik's voice line. */
export default function Panel({ building, onBack, audio }: { building: Building; onBack: () => void; audio: Audio }) {
  useEffect(() => {
    audio.voice(media(building.voice))
    return () => audio.stopVoice()
  }, [audio, building.voice])

  return (
    <section className={`panel panel--${building.district}`}>
      <img className="fill panel__art" src={media(building.panel)} alt={`Comic panel: ${building.name}`} />
      <article className="panel__card">
        <p className="panel__district">{districtNames[building.district]}</p>
        <h2 className="panel__name">{building.name}</h2>
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
        <figure className="panel__voice">
          <figcaption>In my words</figcaption>
          <blockquote>{building.transcript}</blockquote>
        </figure>
        <button type="button" className="cta panel__back" onClick={onBack}>Back to the city</button>
      </article>
    </section>
  )
}
