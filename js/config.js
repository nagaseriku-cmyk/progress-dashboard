/*
 * config.js — 共有保存先（Supabase）の設定
 * ------------------------------------------------------------------
 * 「全員に即時共有」を有効にするには、無料の Supabase プロジェクトを作り、
 * 下の2つの値を貼り付けてください（手順は README.md / SETUP_SUPABASE.md 参照）。
 *
 *   1. https://supabase.com で GitHub ログイン → New project（無料）
 *   2. SQL Editor で SETUP_SUPABASE.md の SQL を実行
 *   3. Project Settings → API から下記2値をコピーして貼り付け
 *
 * 空のままでも動作します（その場合はこの端末のブラウザ内にのみ保存）。
 */
window.SUPABASE_CONFIG = {
  url: "",       // 例: "https://xxxxxxxx.supabase.co"
  anonKey: "",   // 例: "eyJhbGciOi....（anon public キー）"
  table: "dashboard",
  rowId: "japanmatex-dooox"
};
