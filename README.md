[![Lint, Type Check, and Build](https://github.com/hidechae/dj-bingo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hidechae/dj-bingo/actions/workflows/ci.yml)

# DJ Bingo Application

DJビンゴは、DJイベントで使用できるインタラクティブなビンゴゲームアプリケーションです。T3 Stack（Next.js、TypeScript、Prisma、tRPC）で構築されています。

## 機能概要

### 管理者機能

- Google OAuth認証によるログイン
- ビンゴゲームの作成（3x3、4x4、5x5のグリッドサイズ対応）
- 楽曲リストの設定
  - 手動での楽曲追加
  - Spotifyプレイリストからの一括インポート（URLから/マイプレイリスト/検索）
- 参加者用QRコードの生成
- 楽曲の演奏状況管理（演奏済み/未演奏のマーク）
- 参加者の状態確認（グリッド完成状況、勝利状況）
- ビンゴ達成時のリアルタイム通知
- 管理ダッシュボード
- 複数管理者の追加・削除機能
- 管理者追加時の自動招待メール送信（Resend使用）

### 参加者機能

- QRコードスキャンによる簡単参加
- 名前入力のみ（認証不要）
- ビンゴグリッドへの楽曲配置
- リアルタイムでの演奏状況確認
- 自動ビンゴ判定
- ローカルストレージによるセッション維持

## 技術スタック

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: tRPC, Prisma ORM
- **Authentication**: NextAuth.js (Google OAuth)
- **Database**: PostgreSQL (ローカル: Docker, 本番: Neon)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **QR Code**: qrcode library
- **External APIs**: Spotify Web API (プレイリストインポート)
- **Email Service**: Resend (管理者招待メール送信)
- **Testing**: Vitest, React Testing Library
- **Component Documentation**: Storybook

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください：

```bash
cp .env.example .env
```

必要な環境変数：

- `DATABASE_URL`: PostgreSQLの接続URL
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット（`openssl rand -base64 32`で生成）
- `NEXTAUTH_URL`: アプリケーションのURL
- `GOOGLE_CLIENT_ID`: Google OAuthのクライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuthのクライアントシークレット
- `SPOTIFY_CLIENT_ID`: Spotify APIのクライアントID（オプション）
- `SPOTIFY_CLIENT_SECRET`: Spotify APIのクライアントシークレット（オプション）
- `RESEND_API_KEY`: Resend APIキー（オプション、管理者招待メール送信用）

**Resend API設定（オプション）:**

管理者追加時にメール送信機能を使用する場合：

1. [Resend](https://resend.com/)でアカウントを作成
2. [API Keys](https://resend.com/api-keys)ページでAPIキーを生成
3. [Domains](https://resend.com/domains)でドメインを検証（本番環境用）
4. `.env`ファイルにAPIキーを追加：
   ```bash
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxx"
   ```

**注意:**

- 開発環境では検証済みドメインがなくてもテスト送信が可能です
- 本番環境では`src/pages/api/send-admin-invite.ts`の`from`アドレスを検証済みドメインに変更してください

**Spotify API設定（オプション）:**

Spotifyプレイリストからの楽曲インポート機能を使用する場合：

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
2. 新しいアプリケーションを作成
3. Client IDとClient Secretを取得
4. Redirect URIsに以下を追加：
   - 開発環境: `http://127.0.0.1:3000/api/auth/callback/spotify`
   - 本番環境: `https://your-domain.com/api/auth/callback/spotify`
5. `.env`ファイルに認証情報を追加し、`NEXTAUTH_URL`も`127.0.0.1`を使用：
   ```bash
   NEXTAUTH_URL="http://127.0.0.1:3000"
   SPOTIFY_CLIENT_ID="your_spotify_client_id"
   SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
   ```

**⚠️ 重要:** Spotifyは`localhost`ではなく`127.0.0.1`を使用する必要があります。開発時は`http://127.0.0.1:3000`でアクセスしてください。

詳細は[Spotify拡張インポート機能のドキュメント](docs/spotify-enhanced-import.md)を参照してください。

### 3. データベースの起動

Dockerを使用してローカルのPostgreSQLデータベースを起動：

```bash
docker compose up -d
```

### 4. データベースマイグレーション

```bash
npm run db:push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 開発ツール

### テスト

このプロジェクトではVitestとReact Testing Libraryを使用してテストを実施しています。

```bash
# ユニットテストの実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジレポート付きでテスト実行
npm run test:coverage

# Storybookコンポーネントテストの実行（ブラウザ使用）
npm run test:storybook
```

**テスト対象:**

- ユーティリティ関数（ビンゴ勝利判定ロジックなど）
- カスタムフック（ソート機能、ゲームロジックなど）
- コンポーネント（UIコンポーネント、ビジネスロジック含む）

現在のテスト状況: **78 unit tests passing**

**注意:** ユニットテストとStorybookテストは分離されています。`npm test`ではユニットテストのみ実行され、Storybookコンポーネントテストは`npm run test:storybook`で明示的に実行する必要があります。

### Storybook

Storybookを使用してコンポーネントのドキュメント化とインタラクティブな開発環境を提供しています。

```bash
# Storybookの起動（ポート6006で開きます）
npm run storybook

# Storybookの静的ビルド生成
npm run build-storybook
```

**利用可能なストーリー:**

- **UIコンポーネント**: Button（8 stories）
- **共通コンポーネント**: SongInfo（6 stories）
- **ビンゴコンポーネント**: BingoGrid（8 stories）、WinnerBanner（3 stories）、WinStatus（4 stories）、RecentlyPlayedSongs（5 stories）
- **管理コンポーネント**: ParticipantTable（6 stories）

合計: **40 component stories**

Storybookでは以下の機能が利用できます：

- コンポーネントのビジュアルプレビュー
- プロパティのインタラクティブな変更
- アクセシビリティ（A11y）テスト
- 自動生成されたドキュメント

Storybook起動後、ブラウザで http://localhost:6006 を開いてください。

## 使い方

### 管理者

1. トップページから「管理者ログイン」をクリック
2. Googleアカウントでログイン
3. 管理者ダッシュボードで「新しいビンゴを作成」
4. ビンゴのタイトル、サイズ、楽曲リストを設定
   - 手動で楽曲を追加、または
   - 「Spotifyからインポート」で以下の方法から選択：
     - URLから: プレイリストURLを入力して一括インポート
     - マイプレイリスト: Spotifyアカウントと連携して自分のプレイリストから選択
     - 検索: トラック、アルバム、プレイリストを検索してインポート
5. 作成後、QRコードを参加者に共有
6. DJが楽曲を演奏したら、管理画面で「演奏済み」をマーク
7. 参加者がビンゴを達成すると、管理画面に通知が表示される

### 参加者

1. QRコードをスキャンして参加ページにアクセス
2. 名前を入力してゲームに参加
3. 表示された楽曲リストから、ビンゴグリッドに楽曲を配置
4. 「ビンゴを開始」をクリック
5. DJが演奏する楽曲を待ち、ビンゴを目指す

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
npm start
```

### 型チェック

```bash
npm run type-check
```

### リンター

```bash
npm run lint
```

### Git フック

このプロジェクトには pre-commit フックが設定されており、コミット前に自動的に以下のコマンドを実行します：

1. `npm ci` - 依存関係の確認とインストール
2. `npm run format` - Prettier による自動フォーマット
3. `npm run lint` - ESLint による静的解析

フォーマットの問題は自動修正され、リンターエラーがある場合はコミットが中断されます。

## データベース管理

### Prisma Studio（データベースGUI）

```bash
npm run db:studio
```

### マイグレーション

開発環境での新しいマイグレーション：

```bash
npm run db:migrate
```

本番環境でのスキーマプッシュ：

```bash
npm run db:push
```

## 本番環境

本番環境では以下を推奨：

- **Database**: Neon (PostgreSQL as a Service)
- **Hosting**: Vercel, Railway, または任意のNode.js対応ホスティング
- **Environment**: 本番用の環境変数設定

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。
