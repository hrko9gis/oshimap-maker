import { describe, expect, test } from 'vitest'
import { SupabaseRepository } from './supabaseRepository'
import type { SpotDraft } from '../schema/types'

/** from(table).insert/upsert/update/delete/select を記録する最小フェイク。
 *  table は from() ごとに builder に閉じ込め、mutation 実行時に記録する
 *  （後続の from('projects') 呼び出しが記録を上書きしないようにするため）。 */
function makeFakeClient(record: { table?: string; payload?: unknown }) {
  function builderFor(table: string) {
    const b = {
      insert(payload: unknown) { record.table = table; record.payload = payload; return Promise.resolve({ data: null, error: null }) },
      upsert(payload: unknown) { record.table = table; record.payload = payload; return Promise.resolve({ data: null, error: null }) },
      update(payload: unknown) { record.table = table; record.payload = payload; return b },
      delete() { return b },
      select() { return b },
      eq() { return b },
      order() { return Promise.resolve({ data: [], error: null }) },
      single() { return Promise.resolve({ data: null, error: null }) },
      then(res: (v: { data: unknown; error: null }) => void) { res({ data: [], error: null }) },
    }
    return b
  }
  return { from(table: string) { return builderFor(table) } } as never
}

const spot: SpotDraft = {
  id: 's1', title: { ja: 'あ', en: 'a' }, category: 'transport',
  summary: { ja: 'x', en: 'x' }, source_url: 'https://e.com',
  source_name: { ja: 'o', en: 'o' }, lng: 132.9, lat: 34.3,
  location_accuracy: 'exact', stamp_enabled: true, stamp_keyword_answer: 'たけはら',
  stamp_keyword_hint: { ja: 'h', en: 'h' }, sort_order: 1,
  visit_difficulty: 'near_station', status: 'published',
}

describe('SupabaseRepository.upsertSpot', () => {
  test('writes to the spots table without the plaintext answer', async () => {
    const record: { table?: string; payload?: unknown } = {}
    const repo = new SupabaseRepository(makeFakeClient(record), async () => 'user-1')
    await repo.upsertSpot('p1', spot).catch(() => {})
    expect(record.table).toBe('spots')
    expect(JSON.stringify(record.payload)).not.toContain('たけはら')
    expect(JSON.stringify(record.payload)).toContain('stamp_keyword_hash')
  })
})
