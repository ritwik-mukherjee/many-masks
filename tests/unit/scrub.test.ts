import { expect, test } from 'vitest'
import { scrollToTime } from '../../src/lib/scrub'

test('clamps below zero to the start', () => expect(scrollToTime(-0.2, 30)).toBe(0))
test('maps progress linearly', () => expect(scrollToTime(0.5, 30)).toBe(15))
test('clamps past the end to just before the last frame', () => expect(scrollToTime(1.4, 30)).toBeCloseTo(29.95, 5))
