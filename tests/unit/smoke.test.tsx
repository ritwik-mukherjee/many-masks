import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from '../../src/App'

test('renders app root', () => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(pointer: fine)', addEventListener() {}, removeEventListener() {} }))
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
  vi.unstubAllGlobals()
})
