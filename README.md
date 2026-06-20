# プロジェクト進捗ダッシュボード（progress-dashboard）

ジャパンマテックス様 × Dooox の経理効率化プロジェクト向け「進捗ダッシュボード」です。
議事録・文字起こしを貼り付けると、時系列・タスクに自動反映されるデモを含みます。

VS Code でそのまま開いて開発・実行できる、**フレームワーク不要のプレーンな構成**にしています。

---

## ファイル構成

```
progress-dashboard/
├── index.html          … 画面のマークアップ
├── css/
│   └── styles.css      … スタイル（配色・レイアウト）
├── js/
│   ├── data.js         … ★表示データ（ここを編集すれば内容が変わる）
│   └── app.js          … 描画ロジック＋議事録の簡易反映
├── package.json        … 開発サーバ（任意・Vite）
├── .gitignore
└── README.md
```

- **データを変えたいときは `js/data.js` だけを編集**してください（KPI・進捗・タスク・時系列・3テーマ）。
- 画面の見た目は `css/styles.css`、挙動は `js/app.js` です。

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
