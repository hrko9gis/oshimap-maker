import { describe, expect, test, vi } from 'vitest'
import { generateSpotId } from './id'

describe('generateSpotId', () => {
  test('returns a kebab-case id matching the spot-XXXXXXXX pattern', () => {
    const id = generateSpotId([])
    expect(id).toMatch(/^spot-[a-z0-9]{8}$/)
  })

  test('regenerates when the first candidate collides with an existing id', () => {
    const randomSpy = vi.spyOn(Math, 'random')

    // 1回目の呼び出し：常に同じ値なので決定的な候補が1つ得られる
    randomSpy.mockReturnValueOnce(0.5)
    const first = generateSpotId([])

    // 2回目の呼び出し：1発目は same の 0.5（= first と衝突）、2発目は別の値
    randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.9)
    const second = generateSpotId([first])

    expect(second).not.toBe(first)
    expect(second).toMatch(/^spot-[a-z0-9]{8}$/)
    expect(randomSpy).toHaveBeenCalledTimes(3)

    randomSpy.mockRestore()
  })

  test('returns different ids across calls in practice', () => {
    const a = generateSpotId([])
    const b = generateSpotId([a])
    expect(a).not.toBe(b)
  })
})
