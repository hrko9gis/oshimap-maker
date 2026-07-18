import { describe, expect, test } from 'vitest'
import { importLocalProjects } from './importLocal'
import { LocalStorageRepository } from './localStorageRepository'
import { STORAGE_KEY } from '../storage/projectStore'
import type { Project } from '../schema/types'

class MemoryStorage {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.get(k) ?? null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
  key() { return null }
  get length() { return this.m.size }
}

const local: Project = {
  id: 'p1', title: { ja: 'ローカル', en: 'Local' }, area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: 'd', en: 'd' }, theme_type: 'anime', default_language: 'ja',
  visibility: 'private', license: 'CC BY 4.0', disclaimer: { ja: '非公式', en: 'Unofficial' },
  spots: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('importLocalProjects', () => {
  test('copies local projects into the target repository', async () => {
    const src = new MemoryStorage()
    src.setItem(STORAGE_KEY, JSON.stringify([local]))
    const dest = new LocalStorageRepository(new MemoryStorage() as unknown as Storage)
    const result = await importLocalProjects(dest, src as unknown as Storage)
    expect(result.imported).toBe(1)
    const projects = await dest.listProjects()
    expect(projects.some((p) => p.title.ja === 'ローカル')).toBe(true)
  })
})
