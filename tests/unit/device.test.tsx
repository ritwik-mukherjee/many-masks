import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import PhoneCard from '../../src/components/PhoneCard'
import { shouldShowPhoneCard } from '../../src/lib/device'

describe('shouldShowPhoneCard', () => {
  test('desktop with a mouse gets the experience', () => expect(shouldShowPhoneCard(1440, true)).toBe(false))
  test('narrow windows get the card', () => expect(shouldShowPhoneCard(899, true)).toBe(true))
  test('touch-only devices get the card', () => expect(shouldShowPhoneCard(1440, false)).toBe(true))
})

describe('PhoneCard', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('says best on laptop and shows the poster, copy link and resume', () => {
    render(<PhoneCard />)
    expect(screen.getByText('Best on laptop')).toBeInTheDocument()
    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /resume|github/i })).toBeInTheDocument()
  })

  test('copy link without a clipboard API does not throw and tells the visitor', () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    render(<PhoneCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(screen.getByText('Link selected, copy it manually')).toBeInTheDocument()
  })
})
