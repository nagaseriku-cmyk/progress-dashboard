# プロジェクト進捗ダッシュボード（progress-dashboard）

ジャパンマテックス様 × Dooox の経理効率化プロジェクト向け「進捗ダッシュボード」です。
議事録・文字起こしを貼り付けると、時系列・タスクに自動反映されるデモを含みます。

VS Code でそのまま開いて開発・実行できる、**フレームワーク不要のプレーンな構成**にしています。

---

## 🌐 公開URL（関係者はここから閲覧）

**https://nagaseriku-cmyk.github.io/progress-dashboard/**

- GitHub Pages で公開しています。URLを知っている関係者は誰でも閲覧できます。
- 検索エンジンには出ません（`noindex` 設定済み）。
- 表示数値はデモ・ダミーです。

## ✨ 主な機能

- **全体進捗**：Phase（現状把握→着手施策決定→実行）を一目で確認。
- **直近の動き（詳細）**：最新ミーティングの要点を詳しく表示。次回予定も明示。
- **ミーティング時系列**：各回を**クリックすると議事録の全文**がモーダルで開きます。
- **議事録を反映 → 全員に即時共有**：本文を貼り付けて「反映」すると、時系列（全文付き）とタスクに追加され、Firebase 設定時は**全員の画面へリアルタイム同期**されます。

## ☁️ 共有・公開の構成（GCP / Firebase）

- **ホスティング**：Firebase Hosting（`main` への push で自動デプロイ＝更新が即反映）
- **共有データ**：Cloud Firestore（リアルタイム同期。パスワード不要・URL共有のみ）
- **検索除け**：`noindex`（meta ＋ `X-Robots-Tag` ヘッダ）
- セットアップ手順：**[SETUP_FIREBASE.md](SETUP_FIREBASE.md)**（無料・クレカ不要）

## 🔄 更新方法（全員に即時共有）

### 方法1：画面から（推奨・全員に即時共有）
1. 公開URLを開く → 下部「議事録・文字起こしを反映」に本文を貼り付け → **「ダッシュボードに反映」**
2. 右上バッジが **🟢 全員に同期中** なら、その場で全員の画面に反映されます。

> 共有を有効にするには Firebase の初期設定（1回・無料）が必要です。手順：[SETUP_FIREBASE.md](SETUP_FIREBASE.md)
> 未設定（🟡 この端末のみ）の場合、変更はその端末のブラウザ内にのみ保存されます。

### 方法2：データ／コードを編集して公開
```bash
# js/data.js（window.DEFAULT_DATA）や画面を編集 → 公開
git add -A && git commit -m "進捗更新：2026/06/XX 〇〇" && git push
# → Firebase Hosting に自動デプロイされ、全員の公開URLに反映
```

---

## ファイル構成

```
progress-dashboard/
├── index.html                       … 画面のマークアップ（全文モーダル含む）
├── css/
│   └── styles.css                   … スタイル（配色・レイアウト・モーダル）
├── js/
│   ├── config.js                    … ★Firebase 設定（共有保存先）
│   ├── data.js                      … 初期データ（window.DEFAULT_DATA／議事録全文を内包）
│   └── app.js                       … 描画・共有データ層(Firestore)・リアルタイム同期・モーダル
├── firebase.json                    … Firebase Hosting / Firestore 設定
├── .firebaserc                      … Firebase プロジェクトID
├── firestore.rules                  … Firestore アクセスルール
├── SETUP_FIREBASE.md                … 共有・公開を有効にする手順（自動デプロイ設定含む）
├── package.json                     … 開発サーバ（任意・Vite）
├── .gitignore
└── README.md
```

- **共有保存先を設定**するときは `js/config.js`（→ [SETUP_FIREBASE.md](SETUP_FIREBASE.md)）。
- **初期データ**を変えるときは `js/data.js` の `window.DEFAULT_DATA`。
- 見た目は `css/styles.css`、挙動は `js/app.js` です。

---

## 実行方法（どれか1つ）

### A. VS Code の Live Server（いちばん手軽）
1. VS Code 拡張「Live Server」をインストール
2. `index.html` を右クリック → **Open with Live Server**

### B. npm（Vite。開発サーバ＋ホットリロード）
```bash
npm install
npm run dev      # → http://localhost:5173 が開く
npm run build    # 本番ビルド（dist/ に出力）
npm run preview  # ビルド結果のプレビュー
```

### C. サーバを立てずに手軽に確認
```bash
npx serve .      # 簡易静的サーバ
```
※ `index.html` をダブルクリック（file://）でもおおむね動きますが、
ブラウザによっては制限があるため A〜C のいずれかを推奨します。

---

## 議事録の自動反映について

現状の `js/app.js` 内 `parseMinutes()` は、テキストから日付・TODO行・箇条書きを
**正規表現で抽出する簡易ロジック**です。本番では、ここを LLM / API 連携に差し替えられます。

```js
// app.js の reflect() を、例えば次のように置き換える想定
const res = await fetch("/api/parse-minutes", { method: "POST", body: text });
const { timelineEntry, tasks } = await res.json();
tasks.forEach(t => DATA.tasks.unshift(t));
DATA.timeline.unshift(timelineEntry);
```

抽出される形式（`parseMinutes` の戻り値）に合わせれば、描画側はそのまま使えます。

- TODO 行：`・TODO（Dooox）：…（期日：6/30）` のような行を担当・期日つきで抽出
- 日付：本文中の `2026/06/22` 等を時系列の日付に採用
- 箇条書き：先頭が `・/-/＊` の行を時系列の内容に採用

---

## 今後の拡張アイデア

- データを `data.js` から **API/DB** に変更（社内のプロジェクト管理ツールと連携）
- 議事録パースを **LLM** に置き換え（決定事項・課題・ToDo を構造化抽出）
- タスクの編集・完了操作、フィルタ、担当者別ビュー
- 認証（社長／担当者のロール別表示）

---

© 株式会社Dooox / ジャパンマテックス株式会社　経理業務効率化プロジェクト（数値はダミー）
