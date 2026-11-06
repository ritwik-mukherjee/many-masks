import type { Dispatch } from 'react'
import { openingLine } from '../data/opening'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import type { JourneyAction } from '../state/journey'

export default function LoadingScreen({ audio, dispatch }: { audio: Audio; dispatch: Dispatch<JourneyAction> }) {
  function start() {
    audio.unlock()
    // The city sits low under the score until the visitor reaches it.
    audio.ambient('city', 0.12)
    audio.music(media('aud/score.mp3'))
    dispatch({ type: 'START' })
  }

  return (
    <section className="loading">
      <div className="loading__world">
        <img
          className="loading__poster"
          src={media('img/O01.jpg')}
          alt="A dark desk at night: yellow goggles and a cream face wrap resting on a maroon jacket, the Mumbai skyline through the window"
        />
        <svg className="loading__cable" viewBox="0 0 1024 572" aria-hidden="true">
          <path className="loading__cable-glow" d="M 1090 -40 C 1010 40, 900 150, 800 296" pathLength="1" />
          <path className="loading__cable-line" d="M 1090 -40 C 1010 40, 900 150, 800 296" pathLength="1" />
        </svg>
        <span className="loading__lens loading__lens--left" aria-hidden="true" />
        <span className="loading__lens loading__lens--right" aria-hidden="true" />
      </div>
      <div className="loading__halftone" aria-hidden="true" />
      <div className="loading__title">
        <h1 className="loading__name">Ritwik Mukherjee</h1>
        <p className="loading__line caption">{openingLine}</p>
        <button type="button" className="loading__start" onClick={start} autoFocus>
          Put it on
        </button>
        <p className="loading__hint">Sound on. Best with headphones.</p>
      </div>
    </section>
  )
}
