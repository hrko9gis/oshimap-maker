# OshiMap Maker を Cloudflare Pages で公開する

このアプリは **ブラウザの中だけで動く静的サイト**（データは各利用者のブラウザの localStorage に保存、サーバー・データベース不要）です。したがって、そのまま静的ホスティングに載せるだけで URL から開けるようになり、`PowerShell` での起動が不要になります。

- 公開先：**Cloudflare Pages**（無料・SPA 再読込に対応）
- ビルド出力：`dist/`（`npm run build` で生成）
- SPA フォールバック：`public/_redirects`（`/* /index.html 200`）を同梱済み。深いURL（例 `/:projectId/export`）を直接開いても 404 になりません。
- デプロイ設定：`wrangler.jsonc` を同梱済み。Cloudflare が本プロジェクトを **Workers（Static Assets）** として作成し `npx wrangler deploy` を実行する場合、この設定で `dist/` を静的アセットとして配信します（`main` を持たない静的専用）。これにより **Vite 5 のままデプロイでき**、`not_found_handling: "single-page-application"` が SPA ルーティングを担います。

> **もし `wrangler deploy` で「Vite … cannot be automatically configured」エラーが出たら**
> 原因は、プロジェクトが（Pages ではなく）Workers として作成され、設定ファイルが無いため
> wrangler が Vite の自動設定（Vite 6+ 必須）を試みたことです。同梱の `wrangler.jsonc` が
> これを解消します（静的アセット配信を明示するため自動設定が走りません）。Vite の
> アップグレードは不要です。

> **重要な前提（データの保存場所）**
> 静的デプロイでは、作成したマップは **その人が使っているブラウザの中だけ** に保存されます。
> 別の端末・別のブラウザとは共有されず、ブラウザのデータ消去で消えます。
> 複数端末・複数人での共有やログインが必要になったら、設計書フェーズ5（Supabase 等クラウド保存への移行）を検討してください。

---

## ルートA（推奨）：GitHub 連携で自動デプロイ

コードを GitHub に置き、Cloudflare Pages と連携します。以後は `git push` するたびに自動で再ビルド・再公開されます。

### A-1. GitHub リポジトリを用意する
1. GitHub で新しいリポジトリを作成（例：`oshimap-maker`）。公開・非公開どちらでも可。
2. このフォルダを push する：
   ```bash
   cd C:\work\oshimap-maker
   git remote add origin https://github.com/<あなたのユーザー名>/oshimap-maker.git
   git branch -M main
   git push -u origin main
   ```

### A-2. Cloudflare Pages に接続する
1. Cloudflare のダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 先ほどの GitHub リポジトリを選ぶ。
3. ビルド設定を次のとおり入力：
   | 項目 | 値 |
   |------|-----|
   | Framework preset | `Vite`（なければ `None`） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | 環境変数（必要な場合） | `NODE_VERSION` = `20` |
4. **Save and Deploy** を押す。数分で `https://<プロジェクト名>.pages.dev` の URL が発行されます。

以後の更新は `git push` するだけで自動反映されます。

---

## ルートB（最速）：Git なしで直接アップロード

GitHub を使わず、ビルド済みの `dist` フォルダをそのまま上げる方法です。手軽ですが、更新のたびに手作業でのアップロードが必要です。

1. ビルドする：
   ```bash
   cd C:\work\oshimap-maker
   npm install   # 初回のみ
   npm run build
   ```
2. Cloudflare のダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Upload assets**（Direct Upload）。
3. できあがった **`dist` フォルダの中身** をドラッグ＆ドロップしてアップロード。
4. 発行された `*.pages.dev` の URL が公開アドレスです。

> 更新するときは、再度 `npm run build` してから、新しい `dist` の中身をアップロードし直します。

---

## 公開後にやること

- 発行された URL（`https://<プロジェクト名>.pages.dev`）を、マップをつくる人に伝える。以後その人は URL を開くだけで作業できます（`PowerShell` 不要）。
- 独自ドメインを使いたい場合は、Cloudflare Pages の **Custom domains** から設定できます。
- **秘密情報は含まれません**：このアプリはブラウザ内で完結し、合言葉の答えの平文は書き出しファイルにも含まれない設計です。公開しても機微情報は露出しません。

## トラブル時

| 症状 | 対処 |
|------|------|
| 深いURLを開くと 404 | `dist/_redirects` が含まれているか確認（`public/_redirects` を同梱済み）。Direct Upload 時は `dist` の**中身**を上げること。 |
| ビルドが Node のバージョンで失敗 | Cloudflare の環境変数に `NODE_VERSION` = `20`（または `18`）を設定。 |
| 画面が真っ白 | ブラウザの開発者ツールのコンソールを確認。多くはビルド出力ディレクトリの指定ミス（`dist` を指定）。 |
