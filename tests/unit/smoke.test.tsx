import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../../src/App'

test('renders app root', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
})
