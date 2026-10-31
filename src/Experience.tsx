import { useEffect, useMemo, useReducer } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Opening, { Intro } from './components/Opening'
import { createAudio } from './lib/audio'
import { prefersReducedMotion } from './lib/device'
import { initialJourney, journey } from './state/journey'

export default function Experience() {
  const [state, dispatch] = useReducer(journey, initialJourney)
  const audio = useMemo(createAudio, [])
  const reducedMotion = useMemo(prefersReducedMotion, [])

  // The opening is a tall scroll section; every other phase is a fixed full-screen stage.
  useEffect(() => {
    if (state.phase !== 'opening') scrollTo(0, 0)
  }, [state.phase])

  return (
    <main className="experience" data-phase={state.phase}>
      {state.phase === 'loading' && <LoadingScreen audio={audio} dispatch={dispatch} />}
      {state.phase === 'intro' && <Intro dispatch={dispatch} reducedMotion={reducedMotion} />}
      {state.phase === 'opening' && <Opening dispatch={dispatch} audio={audio} reducedMotion={reducedMotion} />}
    </main>
  )
}
