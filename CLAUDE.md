# CLAUDE.md — OshiMap Maker

作業前に必ず `DESIGN.md`（`oshimap` リポジトリの `docs/ideas/oshimap_maker_design.md` のコピー）を
先に参照すること。`DESIGN.md` が実装のスコープ・仕様の一次情報源である。

## 必ず守る制約（設計書より継承）

1. 既存アプリ（ビューア＝別リポジトリ `oshimap`）とはソースを分離する。ビューアのUIコンポーネントは
   import しない。共有すべきは契約（GeoJSONスキーマ・合言葉ハッシュ・コース順・背景地図定義）のみ。
2. 「推し旅」という文言をコード・UI・ドキュメント・プレースホルダ等のどこにも生成しない
   （JR東海の登録商標 第6873703号）。
3. 作品画像・ロゴ・スクリーンショット等のアセットを追加しない。紹介文は独自作成する。
4. カテゴリは固定 enum のみ（`anime_spot | townscape | transport | rest | shopping | viewpoint`）。
   `location_accuracy` は `exact | approximate | area`、`visit_difficulty` は
   `near_station | walk | bus | car`、`status` は `draft | review | published`。
5. `summary` は ja/en 各120字以内（超過はフォームで警告）。
6. 合言葉の答え（平文）は Maker 内部（localStorage）にのみ保持し、配布バンドル・エクスポート・
   バージョン管理に絶対に含めない。エクスポートは NFKC正規化＋trim＋SHA-256(hex) のハッシュのみ。
7. 座標は Google Maps から機械的にコピーしない旨をフォームに明記。住宅地近接は `area` を推奨。
8. 多言語は ja/en の2言語。多言語テキストは `Bilingual = { ja: string; en: string }`。

## コマンド

- `npm run dev` - 開発サーバー
- `npm run build` - 本番ビルド（`tsc -b && vite build`）
- `npm run typecheck` - 型チェック
- `npm run lint` - ESLint
- `npm test` - vitest（単体テスト）
