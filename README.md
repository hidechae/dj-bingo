[![Lint, Type Check, and Build](https://github.com/hidechae/dj-bingo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hidechae/dj-bingo/actions/workflows/ci.yml)

# DJ Bingo Application

DJビンゴは、DJイベントで使用できるインタラクティブなビンゴゲームアプリケーションです。T3 Stack（Next.js、TypeScript、Prisma、tRPC）で構築されています。

## 機能概要

### 管理者機能

- Google OAuth認証によるログイン
- ビンゴゲームの作成（3x3、4x4、5x5のグリッドサイズ対応）
- 楽曲リストの設定
- 参加者用QRコードの生成
- 楽曲の演奏状況管理（演奏済み/未演奏のマーク）
- 参加者の状態確認（グリッド完成状況、勝利状況）
- 管理ダッシュボード

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
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット
- `NEXTAUTH_URL`: アプリケーションのURL
- `GOOGLE_CLIENT_ID`: Google OAuthのクライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuthのクライアントシークレット

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

## 使い方

### 管理者

1. トップページから「管理者ログイン」をクリック
2. Googleアカウントでログイン
3. 管理者ダッシュボードで「新しいビンゴを作成」
4. ビンゴのタイトル、サイズ、楽曲リストを設定
5. 作成後、QRコードを参加者に共有
6. DJが楽曲を演奏したら、管理画面で「演奏済み」をマーク

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
