# 位置登録マップの住所検索ジャンプ機能 設計

作成日：2026-08-05

## 背景・目的

スポット編集画面の「位置（地図をクリック）」（`MapPicker`）は、地図をクリックして座標を登録する方式のみを提供している。目的の場所を地図上で探すのが手間なため、住所を入力して該当エリアへ地図をジャンプできるようにし、その後は従来通りクリックでピンを設置する運用に接続する。

座標を機械的に外部地図サービスからコピーしない、という既存方針（`CLAUDE.md`制約#7、`MapPicker.tsx`内の注意書き）は維持する。住所検索はあくまで「目的のエリアへ地図を移動させる」ためのものであり、検索結果の座標をそのままピン位置として自動確定しない。

## スコープ

- `src/lib/geocode/gsiAddressSearch.ts`（新規）：国土地理院 住所検索APIを呼び出す関数
- `src/lib/geocode/gsiAddressSearch.test.ts`（新規）
- `src/components/MapPicker.tsx`（変更）：住所検索欄・候補リストUIの追加
- `src/components/MapPicker.test.tsx`（変更）：検索〜地図移動のテスト追加

対象外：
- 日本国外の住所（国土地理院APIは日本国内住所のみ対応）
- 検索結果からのピン自動設置（既存方針により非対応）
- 入力中のリアルタイム検索・デバウンス（ボタン/Enterでの明示実行のみ）

## 設計詳細

### 1. 住所検索API呼び出し（新規 `src/lib/geocode/gsiAddressSearch.ts`）

国土地理院 住所検索API（`https://msearch.gsi.go.jp/address-search/AddressSearch?q=<query>`、APIキー不要、CORS対応）を呼び出す。レスポンスはGeoJSON Feature配列：

```json
[
  {
    "geometry": { "type": "Point", "coordinates": [lng, lat] },
    "type": "Feature",
    "properties": { "title": "広島県竹原市本町", "addressCode": "..." }
  }
]
```

これを以下の型・関数に変換する：

```ts
export interface AddressCandidate {
  title: string
  lng: number
  lat: number
}

/** 国土地理院 住所検索APIで住所文字列を検索し、候補一覧を返す。
 *  ネットワークエラー・非200応答時は例外を投げる。0件はエラーではなく空配列。 */
export async function searchAddress(query: string): Promise<AddressCandidate[]> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('住所検索に失敗しました')
  const data = (await res.json()) as Array<{
    geometry: { coordinates: [number, number] }
    properties: { title: string }
  }>
  return data.map((f) => ({
    title: f.properties.title,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }))
}
```

### 2. `MapPicker.tsx` の変更

**状態追加：**
```ts
const [query, setQuery] = useState('')
const [candidates, setCandidates] = useState<AddressCandidate[]>([])
const [searching, setSearching] = useState(false)
const [searchError, setSearchError] = useState<string | null>(null)
```

**検索実行：**
```ts
async function handleSearch() {
  if (!query.trim()) return
  setSearching(true)
  setSearchError(null)
  setCandidates([])
  try {
    const results = await searchAddress(query.trim())
    if (results.length === 0) {
      setSearchError('該当する住所が見つかりませんでした')
    } else {
      setCandidates(results)
    }
  } catch {
    setSearchError('住所検索に失敗しました')
  } finally {
    setSearching(false)
  }
}
```

**候補選択（地図中心のみ移動。ピン・`onChange`には触れない）：**
```ts
const JUMP_ZOOM = 16

function handleSelectCandidate(c: AddressCandidate) {
  mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: JUMP_ZOOM })
  setCandidates([])
}
```

**UI（見出し行の下、地図コンテナの上に追加）：**
```tsx
<div className="flex flex-col gap-1">
  <div className="flex gap-2">
    <input
      aria-label="住所検索"
      className="flex-1 rounded border border-dusk-300 px-2 py-1 text-sm"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSearch()
        }
      }}
      placeholder="住所を入力して地図を移動"
    />
    <button
      type="button"
      onClick={handleSearch}
      disabled={searching}
      className="shrink-0 rounded-full border border-dusk-300 px-3 py-1 text-xs text-dusk-700 hover:bg-dusk-100 disabled:opacity-40"
    >
      {searching ? '検索中…' : '検索'}
    </button>
  </div>
  {searchError && <span className="text-xs text-red-600">{searchError}</span>}
  {candidates.length > 0 && (
    <ul className="flex flex-col gap-0.5 rounded border border-dusk-200 bg-white p-1 text-sm">
      {candidates.map((c, i) => (
        <li key={`${c.title}-${i}`}>
          <button
            type="button"
            onClick={() => handleSelectCandidate(c)}
            className="w-full rounded px-2 py-1 text-left hover:bg-dusk-100"
          >
            {c.title}
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

配置：既存の見出し行（`位置（地図をクリック）` ＋ 背景地図切替ボタン）と地図コンテナ `<div ref={containerRef} .../>` の間に挿入する。

既存のクリックでピン設置・ドラッグ修正・背景地図切替・Google マップ座標コピー禁止の注意書きは変更しない。

## テスト方針

### `gsiAddressSearch.test.ts`
- `fetch` をモックし、正常系（配列を返す）で `AddressCandidate[]` に正しく変換されることを確認
- 0件配列を返すケースで空配列を返す（エラーを投げない）ことを確認
- `res.ok === false` で例外を投げることを確認

### `MapPicker.test.tsx`
- 既存の `maplibre-gl` モックに `flyTo` メソッドを追加
- `searchAddress` をモックし、検索ボタンクリック→候補リスト表示→候補クリックで `map.flyTo` が正しい座標・ズームで呼ばれることを確認
- 候補クリック後、`onChange`（ピン設置コールバック）が呼ばれていないことを確認
- 0件時にエラーメッセージが表示されることを確認

## 非対象・将来検討

- 日本国外の住所検索（国土地理院APIの制約により非対応。将来的に別ジオコーダー併用も検討可能だが本設計のスコープ外）
- 検索候補からの直接ピン設置（既存の「座標を機械的にコピーしない」方針を優先し、あえて非対応とする）
