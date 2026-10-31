import type { Dispatch } from 'react'
import { openingLine } from '../data/opening'
import type { Audio } from '../lib/audio'
import { media } from '../lib/media'
import type { JourneyAction } from '../state/journey'

export default function LoadingScreen({ audio, dispatch }: { audio: Audio; dispatch: Dispatch<JourneyAction> }) {
  function start() {
    audio.unlock()
    audio.ambient('city', 0.35)
    dispatch({ type: 'START' })
  }

  return (
    <section className="loading">
      <img
        className="loading__poster"
        src={media('img/O01.jpg')}
        alt="A dark desk at night: yellow goggles and a cream face wrap resting on a maroon jacket, the Mumbai skyline through the window"
      />
      <div className="loading__title">
        <h1 className="loading__name">Ritwik Mukherjee</h1>
        <p className="loading__line">{openingLine}</p>
        <button type="button" className="loading__start" onClick={start} autoFocus>
          Put it on
        </button>
        <p className="loading__hint">Sound on. Best with headphones.</p>
      </div>
    </section>
  )
}
