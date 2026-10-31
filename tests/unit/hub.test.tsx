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

  test('clicking an entry swings there', () => {
    const dispatch = vi.fn()
    render(<RouteMap dispatch={dispatch} visited={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Palo' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLICK_BUILDING', id: 'B04' })
  })
})
