import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Panel from '../../src/components/Panel'
import { buildingById } from '../../src/data/buildings'
import type { Audio } from '../../src/lib/audio'

const fakeAudio = (): Audio => ({ unlock: vi.fn(), unlocked: () => true, sfx: vi.fn(), voice: vi.fn(), stopVoice: vi.fn(), ambient: vi.fn() })

test('shows the chapter, plays the voice line, and goes back to the city', () => {
  const audio = fakeAudio()
  const onBack = vi.fn()
  const b = buildingById('B01')
  const { unmount } = render(<Panel building={b} onBack={onBack} audio={audio} />)
  expect(screen.getByAltText('Comic panel: CET Campus Circle')).toBeInTheDocument()
  expect(screen.getByText(b.built)).toBeInTheDocument()
  expect(screen.getByText(b.proof)).toBeInTheDocument()
  expect(screen.getByText(b.cracked!)).toBeInTheDocument()
  expect(screen.getByText(b.transcript)).toBeInTheDocument()
  expect(audio.voice).toHaveBeenCalledWith(expect.stringContaining('aud/A-B01.mp3'))
  fireEvent.click(screen.getByRole('button', { name: 'Back to the city' }))
  expect(onBack).toHaveBeenCalled()
  unmount()
  expect(audio.stopVoice).toHaveBeenCalled()
})

test('a building with nothing cracked shows no cracked block', () => {
  render(<Panel building={buildingById('B04')} onBack={vi.fn()} audio={fakeAudio()} />)
  expect(screen.queryByText('What cracked')).toBeNull()
})

test('the voice building lists the rest of the voice work, with a link to speech-signals', () => {
  render(<Panel building={buildingById('B08')} onBack={vi.fn()} audio={fakeAudio()} />)
  expect(screen.getByRole('link', { name: 'speech-signals' })).toHaveAttribute('href', 'https://github.com/ritwik-mukherjee/speech-signals')
  expect(screen.getByText('Voice booking agent with an independent verifier')).toBeInTheDocument()
  expect(screen.getByText('Dental front desk voice demo')).toBeInTheDocument()
})

test('a building with no extra projects shows no extra list', () => {
  render(<Panel building={buildingById('B04')} onBack={vi.fn()} audio={fakeAudio()} />)
  expect(screen.queryByText('Also on this line')).toBeNull()
})

test('HollrAI shows the eval and the agent builder, with no link to the private repo', () => {
  render(<Panel building={buildingById('B11')} onBack={vi.fn()} audio={fakeAudio()} />)
  expect(screen.getByText('hollr-eval')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'hollr-eval' })).toBeNull()
  expect(screen.getByText(/33 realistic Indian callers/)).toBeInTheDocument()
})

test('Palo leads with the market entry result', () => {
  const b = buildingById('B04')
  expect(b.proof).toContain('4+ clients onboarded in the first month')
  expect(b.built).toContain('San Francisco Bay Area')
})
