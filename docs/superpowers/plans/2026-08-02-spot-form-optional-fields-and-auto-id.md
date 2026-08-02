# スポット編集フォーム：出典項目の任意化 & ID自動生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スポット編集フォームで「公式・観光リンク」「出典名」を任意入力にし、「ID」欄はユーザー入力をやめて自動採番する。

**Architecture:** バリデーション（`validateSpot`）と公開前チェック（`automatedChecks`）から `source_url`/`source_name` の必須制約を外し、新規モジュール `id.ts` でランダムID生成関数を追加してスポット作成時に自動採番、フォームのID欄は読み取り専用表示に変更する。

**Tech Stack:** React 18 + TypeScript, Vitest + @testing-library/react, react-router-dom

## Global Constraints

- 「推し旅」という文言をコード・UI・ドキュメントのどこにも生成しない（JR東海の登録商標）。
- カテゴリ・`location_accuracy`・`visit_difficulty`・`status` の固定enumは変更しない。
- `summary` は ja/en 各120字以内のバリデーションは維持する。
- 合言葉の答え（平文）はエクスポートに含めない制約は本タスクでは変更対象外。
- 多言語テキストは `Bilingual = { ja: string; en: string }` 型を維持する。
- id は `^[a-z0-9]+(-[a-z0-9]+)*$`（kebab-case）形式を満たすこと。

参照仕様: `docs/superpowers/specs/2026-08-02-spot-form-optional-fields-and-auto-id-design.md`

---

### Task 1: スポットID自動生成関数の追加

**Files:**
- Create: `src/lib/schema/id.ts`
- Test: `src/lib/schema/id.test.ts`

**Interfaces:**
- Consumes: なし（純粋関数、外部依存なし）
- Produces: `generateSpotId(existingIds: readonly string[]): string` — `spot-` + 英数字8桁の一意なIDを返す。以降のタスクは `../lib/schema/id` からこの関数をimportして使う。

- [ ] **Step 1: Write the failing test**

`src/lib/schema/id.test.ts` を新規作成：

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/schema/id.test.ts`
Expected: FAIL — `Cannot find module './id'` (ファイル未作成のため)

- [ ] **Step 3: Write minimal implementation**

`src/lib/schema/id.ts` を新規作成：

```ts
const ID_RANDOM_LENGTH = 8

function randomSegment(): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + ID_RANDOM_LENGTH)
    .padEnd(ID_RANDOM_LENGTH, '0')
}

/** 新規スポット用のIDを自動採番する。既存IDと衝突した場合は再生成する。 */
export function generateSpotId(existingIds: readonly string[]): string {
  let candidate = `spot-${randomSegment()}`
  while (existingIds.includes(candidate)) {
    candidate = `spot-${randomSegment()}`
  }
  return candidate
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/schema/id.test.ts`
Expected: PASS（3 tests）

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema/id.ts src/lib/schema/id.test.ts
git commit -m "feat: add generateSpotId for auto-numbering new spot IDs"
```

---

### Task 2: `source_url` / `source_name` のバリデーション緩和

**Files:**
- Modify: `src/lib/schema/validation.ts:34-37`
- Test: `src/lib/schema/validation.test.ts`

**Interfaces:**
- Consumes: 既存の `FieldError`, `SpotDraft` 型（変更なし）
- Produces: `validateSpot()` の挙動変更（後続タスクの `checklist.ts` が依存）— `source_url` が空文字列なら `source_url` フィールドのエラーを出さない。`source_url` が非空かつ `http(s)://` で始まらない場合のみエラー。`source_name.ja` は常にエラーを出さない（完全任意）。

- [ ] **Step 1: Write the failing test**

`src/lib/schema/validation.test.ts` の `describe('validateSpot', ...)` ブロック内、`test('non-http source_url is flagged', ...)` の直後に以下を追加：

```ts
  test('empty source_url and source_name are valid (both optional)', () => {
    const errs = validateSpot(
      makeSpot({ source_url: '', source_name: { ja: '', en: '' } }),
    )
    expect(errs.some((e) => e.field === 'source_url')).toBe(false)
    expect(errs.some((e) => e.field === 'source_name.ja')).toBe(false)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/schema/validation.test.ts`
Expected: FAIL — 現状の実装では `source_url: ''` が `http(s)://` にマッチせずエラーになるため `errs.some((e) => e.field === 'source_url')` が `true` になり `toBe(false)` に失敗する。

- [ ] **Step 3: Write minimal implementation**

`src/lib/schema/validation.ts` の該当箇所を変更。変更前：

```ts
  if (!/^https?:\/\//.test(spot.source_url ?? '')) {
    errors.push({ field: 'source_url', message: 'http(s):// のURLが必要です' })
  }
  requireText(errors, 'source_name.ja', spot.source_name?.ja)
```

変更後：

```ts
  if (spot.source_url && !/^https?:\/\//.test(spot.source_url)) {
    errors.push({ field: 'source_url', message: 'http(s):// のURLを入力してください' })
  }
```

（`source_name.ja` の必須チェック行は削除。`source_name` 自体は完全任意項目となるため以降チェックしない。）

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/schema/validation.test.ts`
Expected: PASS（全テスト。`non-http source_url is flagged` は `source_url: 'ftp://x'` が非空かつ不正形式のため引き続きエラーとなり成功する）

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema/validation.ts src/lib/schema/validation.test.ts
git commit -m "fix: make source_url and source_name optional in spot validation"
```

---

### Task 3: 公開前チェックから `source_url` 必須チェックを削除

**Files:**
- Modify: `src/lib/publish/checklist.ts:38-42`
- Test: `src/lib/publish/checklist.test.ts`

**Interfaces:**
- Consumes: Task 2 で変更済みの `validateSpot`（`../schema/validation`）
- Produces: `automatedChecks()` の返す配列から `id: 'source_url'` の項目が消える。`canPublish()` は `source_url`/`source_name` が空でもブロックしなくなる。

- [ ] **Step 1: Write the failing test**

`src/lib/publish/checklist.test.ts` の `describe('canPublish', ...)` ブロック内、末尾（既存の3つの `test` の後）に追加：

```ts
  test('true even when source_url and source_name are empty', () => {
    const spotWithoutSource = {
      ...validSpot,
      source_url: '',
      source_name: { ja: '', en: '' },
    }
    expect(canPublish(spotWithoutSource, project, allManualIds)).toBe(true)
  })
```

また `describe('automatedChecks', ...)` ブロックの末尾に追加：

```ts
  test('does not include a source_url-specific check item', () => {
    const ids = automatedChecks(validSpot, project).map((c) => c.id)
    expect(ids).not.toContain('source_url')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/publish/checklist.test.ts`
Expected: FAIL — 現状は `automatedChecks` に `id: 'source_url'` のチェックが存在し、`source_url: ''` では `passed: false` となるため `canPublish` が `false` を返し、新しい2テストとも失敗する。

- [ ] **Step 3: Write minimal implementation**

`src/lib/publish/checklist.ts` の `automatedChecks` 内、変更前：

```ts
  return [
    {
      id: 'required_fields',
      label: '必須項目がすべて入力されている',
      passed: validateSpot(spot).length === 0,
    },
    {
      id: 'summary_length',
      label: `概要が${SUMMARY_MAX_LEN}字以内（ja/en）`,
      passed: summaryOk,
    },
    {
      id: 'source_url',
      label: '公式・観光リンク（source_url）が設定されている',
      passed: /^https?:\/\//.test(spot.source_url ?? ''),
    },
    {
      id: 'disclaimer',
      label: 'プロジェクトに非公式の断り書き（disclaimer）がある',
      passed: disclaimerOk,
    },
  ]
```

変更後（`id: 'source_url'` のオブジェクトを削除）：

```ts
  return [
    {
      id: 'required_fields',
      label: '必須項目がすべて入力されている',
      passed: validateSpot(spot).length === 0,
    },
    {
      id: 'summary_length',
      label: `概要が${SUMMARY_MAX_LEN}字以内（ja/en）`,
      passed: summaryOk,
    },
    {
      id: 'disclaimer',
      label: 'プロジェクトに非公式の断り書き（disclaimer）がある',
      passed: disclaimerOk,
    },
  ]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/publish/checklist.test.ts`
Expected: PASS（全テスト）

- [ ] **Step 5: Commit**

```bash
git add src/lib/publish/checklist.ts src/lib/publish/checklist.test.ts
git commit -m "fix: stop requiring source_url in the pre-publish automated checklist"
```

---

### Task 4: 新規スポット作成時のID自動採番を配線

**Files:**
- Modify: `src/pages/SpotEditorPage.tsx:1-25, 35-39`
- Test: `src/pages/SpotEditorPage.test.tsx`

**Interfaces:**
- Consumes: `generateSpotId(existingIds: readonly string[]): string` from `../lib/schema/id`（Task 1）
- Produces: `emptySpot(existingIds: readonly string[]): SpotDraft`（export化）— `id` フィールドが `generateSpotId(existingIds)` の戻り値で初期化される。他のフィールドは変更なし。

- [ ] **Step 1: Write the failing test**

`src/pages/SpotEditorPage.test.tsx` を新規作成：

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/SpotEditorPage.test.tsx`
Expected: FAIL — `emptySpot` は現状 export されておらず、また引数を受け取らないため `emptySpot([])` の呼び出しでも `spot.id` が `''`（`generateSpotId` 未使用）となり最初のテストが失敗する。

- [ ] **Step 3: Write minimal implementation**

`src/pages/SpotEditorPage.tsx` の冒頭を変更。変更前：

```ts
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SpotForm } from '../components/SpotForm'
import { validateSpot } from '../lib/schema/validation'
import { useProject } from '../hooks/useProject'
import { useRepository } from '../context/RepositoryContext'
import type { FieldError, SpotDraft } from '../lib/schema/types'

function emptySpot(): SpotDraft {
  return {
    id: '',
    title: { ja: '', en: '' },
    category: 'anime_spot',
    summary: { ja: '', en: '' },
    source_url: '',
    source_name: { ja: '', en: '' },
    lng: Number.NaN,
    lat: Number.NaN,
    location_accuracy: 'approximate',
    stamp_enabled: false,
    sort_order: 1,
    visit_difficulty: 'walk',
    status: 'draft',
  }
}
```

変更後：

```ts
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SpotForm } from '../components/SpotForm'
import { validateSpot } from '../lib/schema/validation'
import { generateSpotId } from '../lib/schema/id'
import { useProject } from '../hooks/useProject'
import { useRepository } from '../context/RepositoryContext'
import type { FieldError, SpotDraft } from '../lib/schema/types'

export function emptySpot(existingIds: readonly string[]): SpotDraft {
  return {
    id: generateSpotId(existingIds),
    title: { ja: '', en: '' },
    category: 'anime_spot',
    summary: { ja: '', en: '' },
    source_url: '',
    source_name: { ja: '', en: '' },
    lng: Number.NaN,
    lat: Number.NaN,
    location_accuracy: 'approximate',
    stamp_enabled: false,
    sort_order: 1,
    visit_difficulty: 'walk',
    status: 'draft',
  }
}
```

続けて、同ファイル内の `useEffect` 呼び出し箇所を変更。変更前（35〜39行目付近）：

```ts
  useEffect(() => {
    if (loading) return
    const existing = project?.spots.find((s) => s.id === spotId)
    setDraft(existing ? { ...existing } : emptySpot())
  }, [loading, project, spotId])
```

変更後：

```ts
  useEffect(() => {
    if (loading) return
    const existing = project?.spots.find((s) => s.id === spotId)
    const existingIds = project?.spots.map((s) => s.id) ?? []
    setDraft(existing ? { ...existing } : emptySpot(existingIds))
  }, [loading, project, spotId])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/SpotEditorPage.test.tsx`
Expected: PASS（全テスト）

- [ ] **Step 5: Commit**

```bash
git add src/pages/SpotEditorPage.tsx src/pages/SpotEditorPage.test.tsx
git commit -m "feat: auto-generate spot id when creating a new spot"
```

---

### Task 5: フォームUIの更新（ID読み取り専用化・任意ラベル表示）

**Files:**
- Modify: `src/components/SpotForm.tsx:75-83, 112-122`
- Test: `src/components/SpotForm.test.tsx`

**Interfaces:**
- Consumes: 既存の `SpotForm` props（変更なし）
- Produces: ID `<input>` が `readOnly` 属性を持つ。ラベル文言変更（`ID（自動生成）`、`公式・観光リンク（http(s)://・任意）`、`出典名（任意）`）。

- [ ] **Step 1: Write the failing test**

`src/components/SpotForm.test.tsx` の `describe('SpotForm', ...)` ブロック内に以下を追加：

```ts
  test('id field is read-only and labeled as auto-generated', () => {
    render(
      <SpotForm
        value={{ ...base, id: 'spot-abcd1234' }}
        onChange={() => {}}
        onSubmit={() => {}}
        errors={[]}
      />,
    )
    const idInput = screen.getByLabelText('ID（自動生成）') as HTMLInputElement
    expect(idInput).toHaveAttribute('readonly')
    expect(idInput.value).toBe('spot-abcd1234')
  })

  test('source_url and source_name labels indicate they are optional', () => {
    render(<SpotForm value={base} onChange={() => {}} onSubmit={() => {}} errors={[]} />)
    expect(screen.getByText('公式・観光リンク（http(s)://・任意）')).toBeInTheDocument()
    expect(screen.getByText('出典名（任意）')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/SpotForm.test.tsx`
Expected: FAIL — 現状ラベルは `ID（kebab-case）` `公式・観光リンク（http(s)://）` `出典名` であり、ID入力欄に `readOnly` もないため、いずれのテストも失敗する。

- [ ] **Step 3: Write minimal implementation**

`src/components/SpotForm.tsx` のID欄（75〜83行目）を変更。変更前：

```tsx
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">ID（kebab-case）</span>
        <input
          className="rounded border border-dusk-300 px-2 py-1 text-sm"
          value={value.id}
          onChange={(e) => set('id', e.target.value)}
        />
        <ErrorText errors={errors} field="id" />
      </label>
```

変更後：

```tsx
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">ID（自動生成）</span>
        <input
          readOnly
          className="rounded border border-dusk-300 bg-dusk-100 px-2 py-1 text-sm text-dusk-600"
          value={value.id}
        />
        <ErrorText errors={errors} field="id" />
      </label>
```

続けて、`source_url` ラベル（112〜120行目付近）を変更。変更前：

```tsx
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">公式・観光リンク（http(s)://）</span>
```

変更後：

```tsx
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-dusk-800">公式・観光リンク（http(s)://・任意）</span>
```

続けて、`source_name` の `BilingualInput` 呼び出し（122行目付近）を変更。変更前：

```tsx
      <BilingualInput label="出典名" value={value.source_name} onChange={(v) => set('source_name', v)} />
```

変更後：

```tsx
      <BilingualInput label="出典名（任意）" value={value.source_name} onChange={(v) => set('source_name', v)} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/SpotForm.test.tsx`
Expected: PASS（全テスト。既存の `renders validation errors` テストは `base.id === ''` のままIDエラーメッセージが表示されることを検証しており、`readOnly` 化後も `ErrorText` は変わらず表示されるため影響なし）

- [ ] **Step 5: Commit**

```bash
git add src/components/SpotForm.tsx src/components/SpotForm.test.tsx
git commit -m "feat: make spot id field read-only and mark source fields optional in the form"
```

---

### Task 6: DESIGN.md の更新と全体テスト・型チェックの確認

**Files:**
- Modify: `DESIGN.md`（§5.2, §7.2, §7.8）

**Interfaces:**
- Consumes: なし
- Produces: なし（ドキュメントのみ。後続タスクなし）

- [ ] **Step 1: §5.2 の表を更新**

`DESIGN.md` の294〜316行目付近、`source_url` 行・`source_name` 行・`id` 行を変更。変更前：

```
| id | スポットID（kebab-case推奨） | `data/schema.md` の `id` と同一形式 |
```

変更後：

```
| id | スポットID（kebab-case、Maker側で `spot-`+ランダム英数字8桁を自動採番。ユーザー入力不要） | `data/schema.md` の `id` と同一形式 |
```

変更前：

```
| source_url | 公式・観光リンク | `SpotProperties.source_url` |
| source_name | 出典名（`{ ja, en }`） | `SpotProperties.source_name` |
```

変更後：

```
| source_url | 公式・観光リンク（任意） | `SpotProperties.source_url` |
| source_name | 出典名（`{ ja, en }`、任意） | `SpotProperties.source_name` |
```

- [ ] **Step 2: §7.2 の必須項目リストを更新**

409〜412行目付近、変更前：

```
- 必須項目（`data/schema.md` 準拠）：id、title(ja/en)、category、summary(ja/en、各120字以内)、
  source_url、source_name(ja/en)、location_accuracy、stamp_enabled、sort_order、
  visit_difficulty、status
```

変更後：

```
- 必須項目：id（Maker側で自動採番）、title(ja/en)、category、summary(ja/en、各120字以内)、
  location_accuracy、stamp_enabled、sort_order、visit_difficulty、status
- source_url、source_name(ja/en) は任意項目とする（公開時にも必須としない）
```

- [ ] **Step 3: §7.8 の公開前チェック項目を更新**

489〜490行目付近、変更前：

```
- 説明文（`summary`）が独自作成の短い概要か（120字制限で機械的にチェック）
- 公式・観光サイトへのリンク（`source_url`）が設定されているか（必須項目のためフォーム側で担保）
- 私有地・住宅地への立入を促していないか（`location_accuracy`が`area`かどうかの確認を促す）
```

変更後：

```
- 説明文（`summary`）が独自作成の短い概要か（120字制限で機械的にチェック）
- 私有地・住宅地への立入を促していないか（`location_accuracy`が`area`かどうかの確認を促す）
```

- [ ] **Step 4: 全体テストと型チェックを実行**

Run: `npm test`
Expected: PASS（全テストスイート）

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md
git commit -m "docs: update DESIGN.md for optional source fields and auto spot id

Note: this repo's DESIGN.md is a copy of docs/ideas/oshimap_maker_design.md
from the oshimap repository; sync this change back there separately."
```

---

## Self-Review Notes

- **Spec coverage:** 設計書の§1(validation)→Task 2、§2(checklist)→Task 3、§3(id.ts)→Task 1、§4(SpotEditorPage)→Task 4、§5(SpotForm UI)→Task 5、§6(DESIGN.md)→Task 6。すべて対応。「影響を受ける既存テスト」節の4ファイルすべてに変更・追加を反映済み。
- **Placeholder scan:** 各ステップに実コード・実コマンドを記載済み。「TODO」等のプレースホルダなし。
- **Type consistency:** `generateSpotId(existingIds: readonly string[]): string` はTask 1で定義し、Task 4で同一シグネチャをそのまま使用。`emptySpot(existingIds: readonly string[]): SpotDraft` はTask 4定義・テストで一致。
