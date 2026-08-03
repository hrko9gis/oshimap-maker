import { describe, expect, test } from 'vitest'
import { emptySpot } from './SpotEditorPage'

describe('emptySpot', () => {
  test('auto-generates a kebab-case id', () => {
    const spot = emptySpot([])
    expect(spot.id).toMatch(/^spot-[a-z0-9]{8}$/)
  })

  test('avoids colliding with existing ids', () => {
    const first = emptySpot([])
    const second = emptySpot([first.id])
    expect(second.id).not.toBe(first.id)
  })

  test('other fields keep their defaults', () => {
    const spot = emptySpot([])
    expect(spot.category).toBe('anime_spot')
    expect(spot.status).toBe('draft')
    expect(spot.sort_order).toBe(1)
  })
})
