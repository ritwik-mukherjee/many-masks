import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Hub from '../../src/components/Hub'
import RouteMap from '../../src/components/RouteMap'
import { buildings } from '../../src/data/buildings'

describe('Hub', () => {
  test('renders one named hotspot button per building', () => {
    render(<Hub dispatch={vi.fn()} visited={[]} />)
    const hotspots = within(screen.getByTestId('hotspots')).getAllByRole('button')
    expect(hotspots).toHaveLength(13)
    expect(hotspots.map((h) => h.getAttribute('aria-label'))).toEqual(buildings.map((b) => b.name))
  })

  test('hovering a building shows its hook; clicking swings there', () => {
    const dispatch = vi.fn()
    render(<Hub dispatch={dispatch} visited={[]} />)
    const cet = within(screen.getByTestId('hotspots')).getByRole('button', { name: 'CET Campus Circle' })
    fireEvent.mouseEnter(cet)
    expect(screen.getByText(buildings[0].hook)).toBeInTheDocument()
    fireEvent.click(cet)
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLICK_BUILDING', id: 'B01' })
  })

  test('hovering warms the building clip with a real video element, once per clip', () => {
    const made = vi.spyOn(document, 'createElement')
    render(<Hub dispatch={vi.fn()} visited={[]} />)
    const spots = within(screen.getByTestId('hotspots'))
    const videos = () => made.mock.results.filter((r) => (r.value as Element).tagName === 'VIDEO').map((r) => r.value as HTMLVideoElement)
    fireEvent.mouseEnter(spots.getByRole('button', { name: 'Velnora' }))
    expect(videos()).toHaveLength(1)
    expect(videos()[0].preload).toBe('auto')
    expect(videos()[0].src).toContain(buildings[1].clip)
    fireEvent.mouseEnter(spots.getByRole('button', { name: 'Velnora' }))
    expect(videos()).toHaveLength(1)
    made.mockRestore()
  })

  test('Enter on a focused hotspot swings there', () => {
    const dispatch = vi.fn()
    render(<Hub dispatch={dispatch} visited={[]} />)
    fireEvent.keyDown(within(screen.getByTestId('hotspots')).getByRole('button', { name: 'Velnora' }), { key: 'Enter' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLICK_BUILDING', id: 'B02' })
  })
})

describe('RouteMap', () => {
  test('lists all 13 by district and marks visited ones', () => {
    render(<RouteMap dispatch={vi.fn()} visited={['B01']} />)
    expect(screen.getAllByRole('button', { name: /CET Campus Circle|Velnora|Palo|Sadie|Wispr Flow India/ })).toHaveLength(5)
    const all = screen.getAllByRole('listitem')
    expect(all).toHaveLength(13)
    expect(within(all[0]).getByText('visited')).toBeInTheDocument()
    expect(within(all[1]).queryByText('visited')).toBeNull()
    expect(screen.getByText('Founder district')).toBeInTheDocument()
  })

  test('the counter counts the 12 chapters, not the Wispr finale', () => {
    render(<RouteMap dispatch={vi.fn()} visited={['B01', 'B13']} />)
    expect(screen.getByText('1/12')).toBeInTheDocument()
  })

  test('clicking an entry swings there', () => {
    const dispatch = vi.fn()
    render(<RouteMap dispatch={dispatch} visited={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Palo' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLICK_BUILDING', id: 'B04' })
  })
})
