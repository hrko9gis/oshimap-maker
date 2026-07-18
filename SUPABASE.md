# OshiMap Maker を Supabase で運用する（フェーズ5a）

フェーズ5a では、保存先を localStorage から **Supabase（PostgreSQL＋Auth＋RLS）** に切り替え、
同一作成者が**複数端末からログインして同じマップを編集**できるようにする。フロントは静的 SPA のまま
（Cloudflare）で、データ通信先が Supabase に変わるだけ。**ビューア `oshimap` は不変。**

> **設計上の前提（重要）**
> - 合言葉の答え（平文）は**サーバに保存しない**。書き込み時にクライアントで SHA-256 ハッシュ化し、
>   `spots.stamp_keyword_hash` に**ハッシュのみ**を保存する（検討書 案A）。DB に平文列は存在しない。
> - `service_role` キーは**クライアント／リポジトリ／バージョン管理に絶対に置かない**。フロントは
>   `anon` キー＋ログインセッションのみ。
> - env（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）が未設定のときは、アプリは従来どおり
>   **localStorage 動作**にフォールバックする（ログイン不要のローカルモード）。

---

## セットアップ手順

1. **Supabase プロジェクトを作成**（無料枠可）。
2. **スキーマを適用**：ダッシュボード → SQL Editor に `supabase/migrations/0001_init.sql` を貼り付けて実行。
   `projects` / `spots` / `project_members`、`is_member()`（SECURITY DEFINER）、RLS ポリシー、オーナー登録トリガが作成される。
3. **認証（マジックリンク）を有効化**：Authentication → Providers → Email を有効化。
   - **本番はカスタムSMTP（Resend / SendGrid 等）を設定**すること。内蔵メールは認証メール合計 **2通/時**で本番不可。
     カスタムSMTP 設定後、Authentication → Rate Limits で送信上限（既定 30通/時）を調整できる。
4. **接続情報を設定**：`.env.example` を `.env.local` にコピーし、Project URL と anon public key を設定：
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...（anon public key）
   ```
   `.env.local` は commit しない（`.gitignore` 済み）。**`service_role` は使わない。**
5. `npm run dev` で起動し、メールアドレスでログイン → マジックリンクを開く。

---

## RLS 手動検証チェックリスト（ライブ環境が必要・自動テスト対象外）

1. **本人のデータが見える**：ユーザーA でログイン → プロジェクト作成 → 一覧に出る。別端末で A でログインしても同じデータが見える。
2. **他人のデータが見えない**：ユーザーB でログイン → A のプロジェクトが**表示されない**。
3. **直接IDでも漏れない**：B のセッションで A のプロジェクトIDを指定しても select が空（RLS）。
4. **合言葉はハッシュのみ**：スポットに合言葉を設定 → Table Editor で `spots.stamp_keyword_hash` にハッシュが入り、
   **平文列が存在しない**（`stamp_keyword_answer` というカラム自体が無い）。
5. **エクスポートに平文が無い**：配布バンドル（`spots.geojson` / `stamp_answers.json`）に平文が含まれない
   （既存 `bundle.test.ts` の不変条件）。

---

## 運用メモ

- **無料枠の自動停止**：無料プロジェクトは7日間 DB アクティビティが無いと一時停止し、再開に約30秒。
  低頻度運用では「約30秒のコールドスタートを許容」か「軽い keep-alive（外部 cron で定期クエリ）」を選ぶ。
  常時稼働が必要になれば Pro（$25/月・停止なし）を検討。
- **バックアップ**：Supabase のバックアップ機能／定期エクスポートを併用。
- **共同編集（フェーズ5b）**：`project_members` とロール別 RLS は本フェーズで用意済み。招待UI・reviewer 運用は 5b で追加。
