import { describe, expect, test, beforeEach } from 'vitest'
import { LocalStorageRepository } from './localStorageRepository'
import { STORAGE_KEY } from '../storage/projectStore'

class MemoryStorage {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.get(k) ?? null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
  key() { return null }
  get length() { return this.m.size }
}

const input = {
  title: { ja: 'テスト', en: 'Test' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '説明', en: 'Desc' },
  theme_type: 'anime',
  default_language: 'ja' as const,
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式', en: 'Unofficial' },
  official_url: undefined,
}

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
    repo = new LocalStorageRepository(storage as unknown as Storage)
  })

  test('creates and lists projects', async () => {
    expect(await repo.listProjects()).toEqual([])
    const created = await repo.createProject(input)
    const list = await repo.listProjects()
    expect(list.map((p) => p.id)).toContain(created.id)
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  test('getProject returns null for unknown id', async () => {
    expect(await repo.getProject('nope')).toBeNull()
  })
})
