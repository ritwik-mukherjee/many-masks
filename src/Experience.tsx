import { useEffect, useMemo, useReducer, useRef } from 'react'
import ComicFreeze from './components/ComicFreeze'
import Hub from './components/Hub'
import LoadingScreen from './components/LoadingScreen'
import Opening, { Intro } from './components/Opening'
import Panel from './components/Panel'
import RouteMap from './components/RouteMap'
import SwingPlayer from './components/SwingPlayer'
import { buildingById, type BuildingId } from './data/buildings'
import { createAudio } from './lib/audio'
import { prefersReducedMotion } from './lib/device'
import { loadVisited, saveVisited } from './lib/visited'
import { initialJourney, journey } from './state/journey'

export default function Experience() {
  const [state, dispatch] = useReducer(journey, initialJourney)
  const audio = useMemo(createAudio, [])
  const reducedMotion = useMemo(prefersReducedMotion, [])
  const saved = useMemo(loadVisited, [])
  const lastFrame = useRef<HTMLCanvasElement>(document.createElement('canvas'))
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
      {state.phase === 'swinging' && state.current && (
        <SwingPlayer
          key={state.current}
          building={buildingById(state.current)}
          audio={audio}
          reducedMotion={reducedMotion}
          onEnded={(frame) => { lastFrame.current = frame; dispatch({ type: 'SWING_ENDED' }) }}
        />
      )}
      {state.phase === 'freezing' && state.current && (
        <ComicFreeze
          source={lastFrame.current}
          panelSrc={buildingById(state.current).panel}
          audio={audio}
          reducedMotion={reducedMotion}
          onDone={() => dispatch({ type: 'FREEZE_DONE' })}
        />
      )}
      {state.phase === 'panel' && state.current && (
        <>
          <Panel
            key={state.current}
            building={buildingById(state.current)}
            audio={audio}
            onBack={() => { audio.sfx('whoosh'); dispatch({ type: 'BACK_TO_CITY' }) }}
          />
          <RouteMap dispatch={dispatch} visited={visited} defaultOpen={false} />
        </>
      )}
    </main>
  )
}
