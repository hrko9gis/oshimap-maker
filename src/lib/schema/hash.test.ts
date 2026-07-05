import { describe, expect, test } from 'vitest'
import { normalizeKeyword, sha256Hex } from './hash'

describe('normalizeKeyword', () => {
  test('applies NFKC and trims', () => {
    expect(normalizeKeyword('  ﾀﾏﾕﾗ  ')).toBe('タマユラ')
  })
})

describe('sha256Hex', () => {
  test('matches known SHA-256 of "abc"', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  test('viewer interop: hash of normalized keyword is stable hex length 64', async () => {
    const hex = await sha256Hex(normalizeKeyword('たまゆら'))
    expect(hex).toMatch(/^[0-9a-f]{64}$/)
  })
})
