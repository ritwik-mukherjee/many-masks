import { useEffect, useMemo, useReducer } from 'react'
import Hub from './components/Hub'
import LoadingScreen from './components/LoadingScreen'
import Opening, { Intro } from './components/Opening'
import type { BuildingId } from './data/buildings'
import { createAudio } from './lib/audio'
import { prefersReducedMotion } from './lib/device'
import { loadVisited, saveVisited } from './lib/visited'
import { initialJourney, journey } from './state/journey'

export default function Experience() {
  const [state, dispatch] = useReducer(journey, initialJourney)
  const audio = useMemo(createAudio, [])
  const reducedMotion = useMemo(prefersReducedMotion, [])
  const saved = useMemo(loadVisited, [])
  const visited = useMemo<BuildingId[]>(() => [...new Set([...saved, ...state.visited])], [saved, state.visited])

  useEffect(() => saveVisited(visited), [visited])

  // The opening is a tall scroll section; every other phase is a fixed full-screen stage.
  useEffect(() => {
    if (state.phase !== 'opening') scrollTo(0, 0)
  }, [state.phase])

  return (
    <main className="experience" data-phase={state.phase}>
      {state.phase === 'loading' && <LoadingScreen audio={audio} dispatch={dispatch} />}
      {state.phase === 'intro' && <Intro dispatch={dispatch} reducedMotion={reducedMotion} />}
      {state.phase === 'opening' && <Opening dispatch={dispatch} audio={audio} reducedMotion={reducedMotion} />}
      {state.phase === 'hub' && <Hub dispatch={dispatch} visited={visited} />}
    </main>
  )
}
