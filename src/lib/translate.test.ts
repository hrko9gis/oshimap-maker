import { describe, expect, test, afterEach } from 'vitest'
import { isTranslateAvailable, translateJaToEn } from './translate'

const g = globalThis as unknown as { Translator?: unknown }

afterEach(() => {
  delete g.Translator
})

describe('isTranslateAvailable', () => {
  test('false when no Translator global', () => {
    delete g.Translator
    expect(isTranslateAvailable()).toBe(false)
  })
  test('true when Translator global exists', () => {
    g.Translator = { create: async () => ({ translate: async (t: string) => t }) }
    expect(isTranslateAvailable()).toBe(true)
  })
})

describe('translateJaToEn', () => {
  test('uses the Translator API to translate ja to en', async () => {
    g.Translator = {
      create: async () => ({ translate: async (t: string) => `EN(${t})` }),
    }
    expect(await translateJaToEn('こんにちは')).toBe('EN(こんにちは)')
  })
  test('throws when Translator is unavailable', async () => {
    delete g.Translator
    await expect(translateJaToEn('x')).rejects.toThrow()
  })
})
