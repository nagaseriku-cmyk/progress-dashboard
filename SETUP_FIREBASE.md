# Firebase（GCP）セットアップ手順 — 全員に即時共有 ＋ 公開ホスティング

このダッシュボードを **Firebase Hosting（公開）＋ Cloud Firestore（リアルタイム共有）** で動かす手順です。
GCP に統一された Google アカウントで進めてください。費用は **無料（Spark プラン・クレカ不要）** の範囲で収まります。

あなたの作業は「**①プロジェクト作成 → ②Firestore有効化 → ③Web設定値をコピー → ④自動デプロイ用シークレット登録**」だけです。
③④の値をいただければ、設定の反映・デプロイ・動作確認は私（Dooox）が実施します。

---

## ① Firebase プロジェクトを作成
1. https://console.firebase.google.com を開く（GCP統一の Google アカウントでログイン）
2. **「プロジェクトを追加」**（既存の GCP プロジェクトを選んでもOK）
3. プロジェクト名は任意（例：`japanmatex-dooox-dashboard`）。Google アナリティクスは任意（不要なら無効でOK）

## ② Firestore Database を有効化
1. 左メニュー **構築 → Firestore Database** →「データベースの作成」
2. ロケーション：**asia-northeast1（東京）** 推奨
3. 起動モード：どちらでも可（ルールは後で当方の `firestore.rules` を適用します）

## ③ Web アプリを登録して設定値をコピー（←私に共有いただく値）
1. 歯車 **プロジェクトの設定** → 下部「マイアプリ」→ **Web `</>`** を追加
2. アプリ名は任意。Hosting のチェックは任意（後で当方が設定します）
3. 表示される **`firebaseConfig`** の中身（下記6項目）をコピーして私に貼り付けてください：

```js
apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
```

> これらは「公開して問題ない識別子」です（秘密鍵ではありません）。実際のアクセス制御は `firestore.rules` で行います。

## ④ 自動デプロイ用のシークレットを登録（git push で即反映するため）
いちばん簡単な方法（**推奨**）：ローカルで一度だけ実行
```bash
npm i -g firebase-tools     # 未インストールなら
firebase login              # Googleでログイン（ブラウザが開く）
cd progress-dashboard
firebase init hosting:github   # 対象リポジトリを選ぶと、
                               # GitHub の Secret(FIREBASE_SERVICE_ACCOUNT) を自動登録
```
- 「set up automatic deploys?」→ Yes、リポジトリは `nagaseriku-cmyk/progress-dashboard`
- 既存の `firebase.json` を上書きするか聞かれたら **上書きしない（No）** を選んでください（当方の設定を使います）

> 手動で行う場合：GCP コンソールでサービスアカウントを作成しキー(JSON)を発行 → リポジトリの
> **Settings → Secrets and variables → Actions** に `FIREBASE_SERVICE_ACCOUNT` という名前で JSON を登録。
> さらに下の「付録：自動デプロイ ワークフロー」の YAML を `.github/workflows/firebase-hosting.yml` として
> 追加してください（`firebase init hosting:github` を使う場合はこのファイルは自動生成されます）。

---

## 付録：自動デプロイ ワークフロー（手動で追加する場合）
`firebase init hosting:github` を使わない場合は、GitHub の Web UI（**Add file → Create new file**）で
`.github/workflows/firebase-hosting.yml` を作り、以下を貼り付けてください。
（`REPLACE_WITH_PROJECT_ID` はあなたのプロジェクトIDに置換。シークレット未登録の間は自動スキップされます）

```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Check Firebase secret
        id: guard
        run: |
          if [ -n "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}" ]; then
            echo "ready=true" >> "$GITHUB_OUTPUT"
          else
            echo "ready=false" >> "$GITHUB_OUTPUT"
          fi
      - uses: actions/checkout@v4
        if: steps.guard.outputs.ready == 'true'
      - uses: FirebaseExtended/action-hosting-deploy@v0
        if: steps.guard.outputs.ready == 'true'
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: REPLACE_WITH_PROJECT_ID
          channelId: live
```

---

## このあと私（Dooox）が実施すること
- いただいた `firebaseConfig` を `js/config.js` に設定
- `.firebaserc` と `.github/workflows/firebase-hosting.yml` の **projectId** をあなたのIDに置換
- `firestore.rules` を適用（共有ドキュメントのみ読み書き可）
- 初回デプロイ → 公開URL（`https://<projectId>.web.app`）で動作確認
- 2画面で「反映 → もう片方に即時反映」されることを確認

---

## できあがる状態
- 公開URL：**`https://<projectId>.web.app`**（および `…firebaseapp.com`）
- **パスワード不要・URL共有のみ**で全員が閲覧可能（検索除け noindex 継続）
- 誰かが議事録を「反映」すると、**開いている全員の画面に即時同期**（リロード不要）
- `main` に push すると **HTML/コードの更新も自動デプロイで即反映**

## 将来：Dooox 限定などにアクセスを締めたい場合
`firestore.rules` を Firebase Auth ベースに変更し、許可メールのみ読み書き可にできます。
ホスティング自体をログイン必須にしたい場合は、別途ゲート（例：Firebase Auth + 簡易ログイン画面）を追加します。ご要望時に対応します。

## 無料枠（Spark プラン）の目安
- Firestore：読み取り 50,000回/日・書き込み 20,000回/日・保存 1GiB（本用途は数%未満）
- Hosting：保存 10GB・転送 10GB/月（1ページ約60KB。十分）
- クレジットカード登録不要
