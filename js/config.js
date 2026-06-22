/*
 * config.js — 共有保存先（Firebase / Cloud Firestore）の設定
 * ------------------------------------------------------------------
 * 「全員に即時共有」を有効にするには、Firebase プロジェクトを作り、
 * 下の Web アプリ設定値（公開値）を貼り付けてください。
 * 手順は SETUP_FIREBASE.md を参照。
 *
 *   1. https://console.firebase.google.com で（GCP統一のGoogleアカウントで）プロジェクト作成
 *   2. Build → Firestore Database を有効化
 *   3. プロジェクト設定 → 「マイアプリ」で Web アプリ(</>)を追加
 *      → 表示される firebaseConfig の値を下にコピー
 *
 * ここに入る apiKey 等は「公開して問題ない識別子」です（秘密鍵ではありません）。
 * 空のままでも動作します（その場合はこの端末のブラウザ内にのみ保存）。
 */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",        // 例: "your-project.firebaseapp.com"
  projectId: "",         // 例: "your-project"
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// 保存先ドキュメント（変更不要）
window.DASHBOARD_DOC = { collection: "dashboard", id: "japanmatex-dooox" };
