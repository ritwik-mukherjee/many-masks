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

  describe('markers', () => {
    const tags = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>('.hub__marker')]

    test('every building has a named tag, without the screen reader hearing each building twice', () => {
      const { container } = render(<Hub dispatch={vi.fn()} visited={[]} />)
      expect(tags(container).map((t) => t.textContent)).toEqual(buildings.map((b) => b.marker.label))
      expect(container.querySelector('.hub__markers')).toHaveAttribute('aria-hidden', 'true')
      expect(tags(container).every((t) => t.tabIndex === -1)).toBe(true)
      expect(within(screen.getByTestId('hotspots')).getAllByRole('button')).toHaveLength(13)
    })

    test('clicking a tag swings to that building', () => {
      const dispatch = vi.fn()
      const { container } = render(<Hub dispatch={dispatch} visited={[]} />)
      fireEvent.click(tags(container)[3])
      expect(dispatch).toHaveBeenCalledWith({ type: 'CLICK_BUILDING', id: 'B04' })
    })

    test('hovering a tag shows the full name and hook and lights the building', () => {
      const { container } = render(<Hub dispatch={vi.fn()} visited={[]} />)
      fireEvent.mouseEnter(tags(container)[7])
      const tip = container.querySelector('.hub__tip')!
      expect(tip).toHaveTextContent(buildings[7].name)
      expect(tip).toHaveTextContent(buildings[7].hook)
      expect(within(screen.getByTestId('hotspots')).getByRole('button', { name: buildings[7].name })).toHaveClass('is-hot')
    })

    test('visited buildings are marked, and Wispr stands out', () => {
      const { container } = render(<Hub dispatch={vi.fn()} visited={['B02']} />)
      expect(tags(container)[1]).toHaveClass('is-visited')
      expect(tags(container)[0]).not.toHaveClass('is-visited')
      expect(tags(container)[12]).toHaveClass('hub__marker--wispr')
    })

    test('tags sit inside the image', () => {
      for (const b of buildings) {
        const [x, y] = b.marker.at
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(100)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(100)
      }
    })
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
