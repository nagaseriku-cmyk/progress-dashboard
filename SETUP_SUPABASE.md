# 「全員に即時共有」を有効にする手順（Supabase・無料）

このダッシュボードは、保存先（Supabase）を設定すると、**誰かが「反映」した内容が全員の画面に即時共有**されます。
未設定でも動きますが、その場合は変更がその端末のブラウザ内にしか残りません。

所要時間：約3〜5分。費用：無料枠で十分です。

---

## 手順

### 1. Supabase プロジェクトを作成
1. https://supabase.com にアクセスし、**「Start your project」** → GitHub でログイン
2. **New project** を作成（Organization 任意、Region は `Northeast Asia (Tokyo)` 推奨）
3. データベースのパスワードは任意（控えておく）。作成完了まで1〜2分待つ

### 2. テーブルと共有設定を作る（SQL を1回実行）
左メニュー **SQL Editor** → **New query** に以下を貼り付けて **Run**：

```sql
-- 1) ダッシュボードの保存テーブル（1行に全データをJSONで保持）
create table if not exists public.dashboard (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 2) ブラウザ（匿名キー）から読み書きできるようにする
alter table public.dashboard enable row level security;

create policy "read"   on public.dashboard for select using (true);
create policy "insert" on public.dashboard for insert with check (true);
create policy "update" on public.dashboard for update using (true) with check (true);

-- 3) リアルタイム同期を有効化
alter publication supabase_realtime add table public.dashboard;
```

> 補足：このダッシュボードは検索エンジン非公開（noindex）の社内向け用途を想定し、匿名キーでの読み書きを許可しています。
> より厳密に制御したい場合は、後述「セキュリティを強める場合」を参照してください。

### 3. URL と anon キーを取得
左メニュー **Project Settings（歯車）→ API** を開き、次の2つをコピー：
- **Project URL**（例：`https://abcdefgh.supabase.co`）
- **Project API keys → `anon` `public`**（`eyJ...` で始まる長い文字列）

### 4. 設定ファイルに貼り付け
[js/config.js](js/config.js) を開き、2か所を埋めて保存：

```js
window.SUPABASE_CONFIG = {
  url: "https://abcdefgh.supabase.co",   // ← Project URL
  anonKey: "eyJhbGciOi....",             // ← anon public キー
  table: "dashboard",
  rowId: "japanmatex-dooox"
};
```

### 5. 公開（反映）
```bash
git add -A && git commit -m "Supabase設定を追加（全員に即時共有）" && git push
```
数分後、公開URLが共有モードになります。画面右上のバッジが **🟢 全員に同期中** になれば成功です。

---

## 動作確認
- 2つのブラウザ（またはPCとスマホ）で公開URLを開く
- 片方で議事録を「反映」→ もう片方の画面が**自動で更新**されればOK
- 右上バッジ：🟢 全員に同期中 ／ 🟡 この端末のみ（共有未設定）

## セキュリティを強める場合（任意）
匿名の読み書きを避けたい場合は、上記 policy の `using (true)` を見直し、
たとえば「更新は特定のキーを持つ場合のみ」等に変更します。社内限定の noindex 運用であれば
現状の設定でも実用上の問題は小さいですが、要件に応じてご相談ください。
