export type District = 'founder' | 'growth' | 'builder' | 'workshop' | 'finale'
export type BuildingId = 'B01' | 'B02' | 'B03' | 'B04' | 'B05' | 'B06' | 'B07' | 'B08' | 'B09' | 'B10' | 'B11' | 'B12' | 'B13'

export interface Building {
  id: BuildingId
  name: string
  district: District
  hook: string
  /** Polygon in percent of H01 width/height, 0..100. */
  hotspot: [number, number][]
  priority: 'M' | 'S'
  /** 'vid/V01.mp4'; absent means the 2.5D push-in fallback. */
  clip?: string
  landing: string
  panel: string
  voice: string
  transcript: string
  built: string
  proof: string
  cracked?: string
}
