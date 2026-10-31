import { buildings, type BuildingId } from '../data/buildings'

const KEY = 'many-masks:visited'
const valid = new Set<string>(buildings.map((b) => b.id))

/** Visited buildings from earlier visits. Blocked or corrupt storage just means none. */
export function loadVisited(): BuildingId[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === 'string' && valid.has(x)) as BuildingId[]) : []
  } catch {
    return []
  }
}

export function saveVisited(ids: BuildingId[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* private window or storage blocked: visited marks are simply not kept */
  }
}
