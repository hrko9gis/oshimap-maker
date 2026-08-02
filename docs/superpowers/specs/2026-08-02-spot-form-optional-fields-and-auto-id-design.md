# スポット編集フォーム：出典項目の任意化 & ID自動生成 設計

作成日：2026-08-02

## 背景・目的

スポット編集画面（`SpotForm.tsx`）で以下2点の使い勝手を改善する。

1. 「公式・観光リンク（source_url）」「出典名（source_name）」が必須入力になっており、
   下書き段階での作業の障壁になっている。
2. 「ID（kebab-case）」欄はユーザーが自分でkebab-case形式のIDを考えて入力する必要があり、
   形式（kebab-caseとは何か）の説明もなく負担が大きい。

## スコープ

- `src/lib/schema/validation.ts`：`source_url` / `source_name` のバリデーション緩和
- `src/lib/publish/checklist.ts`：公開前自動チェックから `source_url` 必須チェックを削除
- `src/lib/schema/id.ts`（新規）：スポットID自動生成ロジック
- `src/pages/SpotEditorPage.tsx`：新規スポット作成時にIDを自動採番
- `src/components/SpotForm.tsx`：ID欄を読み取り専用化、`source_url`/`source_name` ラベルに「（任意）」を付与
- `DESIGN.md`：§5.2・§7.2・§7.8 の該当記述を本設計に合わせて更新
- 上記変更に付随する既存テスト（`validation.test.ts`, `checklist.test.ts`, `SpotForm.test.tsx` 等）の更新

対象外：スタンプ関連の必須項目（`stamp_keyword_answer`/`stamp_keyword_hint`）、他のenumフィールドの必須性。

## 設計詳細

### 1. バリデーション（`validation.ts`）

現状：
```ts
if (!/^https?:\/\//.test(spot.source_url ?? '')) {
  errors.push({ field: 'source_url', message: 'http(s):// のURLが必要です' })
}
requireText(errors, 'source_name.ja', spot.source_name?.ja)
```

変更後：
- `source_url`：値が空文字列なら検証をスキップ（エラーなし）。値が入力されている場合のみ
  `^https?:\/\//` 形式チェックを行う（不正な形式の入力は引き続き弾く）。
- `source_name.ja`：必須チェックを削除。完全に任意項目とする。

`id` の kebab-case 形式チェックは維持する（自動生成されたIDも常にこの形式を満たす）。

### 2. 公開前チェック（`checklist.ts`）

`automatedChecks()` から次のチェック項目を削除する：

```ts
{
  id: 'source_url',
  label: '公式・観光リンク（source_url）が設定されている',
  passed: /^https?:\/\//.test(spot.source_url ?? ''),
},
```

`required_fields` チェック（`validateSpot(spot).length === 0`）は上記バリデーション変更に
連動して自動的に緩和される。`MANUAL_CHECK_ITEMS`（目視チェック）は変更しない。

### 3. ID自動生成（新規 `src/lib/schema/id.ts`）

```ts
const ID_RANDOM_LENGTH = 8

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 2 + ID_RANDOM_LENGTH).padEnd(ID_RANDOM_LENGTH, '0')
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

- 形式は `spot-` + 英数字8桁（`[a-z0-9]{8}`）。既存の kebab-case 検証（`KEBAB`正規表現）を満たす。
- `Math.random()` ベースで十分（36^8 ≈ 2.8兆通り）。衝突時のみ再生成するため暗号論的な
  乱数は不要と判断（YAGNI）。

### 4. スポット作成フロー（`SpotEditorPage.tsx`）

`emptySpot()` は呼び出し時点でプロジェクトの既存スポットID一覧が必要なため、
`project` を引数に取る形に変更する：

```ts
function emptySpot(existingIds: readonly string[]): SpotDraft {
  return {
    id: generateSpotId(existingIds),
    // ...既存のフィールドはそのまま
  }
}
```

呼び出し側（`useEffect` 内）：
```ts
const existing = project?.spots.find((s) => s.id === spotId)
setDraft(existing ? { ...existing } : emptySpot(project?.spots.map((s) => s.id) ?? []))
```

編集時（`existing` が存在する場合）はIDを再生成せず、そのまま維持する。

### 5. フォームUI（`SpotForm.tsx`）

- ID欄：
  - ラベルを `ID（kebab-case）` → `ID（自動生成）` に変更。
  - `<input>` に `readOnly` を付与し、編集不可であることを視覚的に示す（グレー背景など
    既存のTailwindユーティリティで表現）。
  - 「kebab-caseとは」の説明が不要になるため撤去。
- `source_url` ラベル：`公式・観光リンク（http(s)://）` → `公式・観光リンク（http(s)://・任意）`
- `source_name` の `BilingualInput` の `label` に `（任意）` を付与：`出典名（任意）`

### 6. DESIGN.md の更新

- §5.2 の表：
  - `source_url` 行、`source_name` 行の説明に「（任意）」を追記。
  - `id` 行に「Maker側で自動採番（`spot-`+ランダム英数字8桁）。ユーザー入力は不要」を追記。
- §7.2：必須項目リストから `source_url`、`source_name` を削除。
- §7.8：「公式・観光サイトへのリンク（`source_url`）が設定されているか」の項目を削除。
- 変更箇所には、原本（`oshimap` リポジトリ `docs/ideas/oshimap_maker_design.md`）との
  乖離が生じる旨をコミットメッセージに残す（原本側への反映は別タスク）。

## 影響を受ける既存テスト

- `src/lib/schema/validation.test.ts`：`source_url`/`source_name` が空でもエラーが出ない
  ケースを追加・既存の必須チェックのテストを更新。
- `src/lib/publish/checklist.test.ts`：`source_url` 未設定でも `automatedChecks` の該当項目が
  なくなる／`canPublish` が `source_url` 欠如で false にならないことを反映。
- `src/components/SpotForm.test.tsx`：ID欄が読み取り専用であること、ラベル文言の変更を反映。
- 新規：`src/lib/schema/id.test.ts`（`generateSpotId` の形式・衝突回避の単体テスト）。

## 非対象・将来検討

- 既存プロジェクトデータに含まれる、旧仕様で手入力された非 `spot-` 形式のIDはそのまま
  保持する（マイグレーション不要、読み取り専用化のみで移行は完了する）。
- IDを人間が読める文字列にする案（英語タイトルからのスラッグ生成等）は不採用
  （本設計の質問で決定）。将来ニーズが出た場合に別途検討。
