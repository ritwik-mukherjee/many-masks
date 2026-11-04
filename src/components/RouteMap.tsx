import { useState, type Dispatch } from 'react'
import { buildings, districtNames, type BuildingId, type District } from '../data/buildings'
import type { JourneyAction } from '../state/journey'

const ORDER: District[] = ['founder', 'growth', 'builder', 'workshop', 'finale']

/** The skip menu: every building, grouped by district, keyboard reachable. */
export default function RouteMap({ dispatch, visited, defaultOpen = true }: { dispatch: Dispatch<JourneyAction>; visited: BuildingId[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <nav className={`route${open ? ' route--open' : ''}`} aria-label="Route map">
      <button type="button" className="route__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Route map <span aria-hidden="true">{visited.filter((id) => id !== 'B13').length}/12</span>
      </button>
      <div className="route__body" hidden={!open}>
        {ORDER.map((d) => (
          <section key={d} className={`route__district route__district--${d}`}>
            <h2>{districtNames[d]}</h2>
            <ul>
              {buildings.filter((b) => b.district === d).map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => dispatch({ type: 'CLICK_BUILDING', id: b.id })}>{b.name}</button>
                  {visited.includes(b.id) && <span className="route__visited">visited</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
