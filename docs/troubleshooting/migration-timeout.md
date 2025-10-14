# Migration Timeout on Vercel

このドキュメントでは、Vercel デプロイ時に Prisma マイグレーションが止まってしまう問題とその解決方法を説明します。

## 症状

Vercel へのデプロイ時に、以下のような症状が発生します：

- ビルドプロセスが `prisma migrate deploy` で停止する
- タイムアウトエラーが発生してデプロイが失敗する
- マイグレーションが完了せず、ビルドが進まない

## エラーメッセージの例

```
Running "prisma migrate deploy"
...
(処理が止まる)
...
Error: Command "npm run vercel-build" timed out after 10m
```

## 原因

この問題は、**Transaction Pooler を使ってマイグレーションを実行しようとした**ことが原因です。

### なぜ Transaction Pooler ではマイグレーションができないのか？

Prisma のマイグレーションは、以下の操作を含む複雑なトランザクションを実行します：

1. スキーマロックの取得
2. 複数の DDL 文の実行（CREATE TABLE、ALTER TABLE など）
3. マイグレーション履歴の記録
4. 長時間のトランザクション維持

**Transaction Pooler（PgBouncer のトランザクションモード）の制約：**

- 各トランザクション終了時に接続が切り替わる
- セッション状態（プリペアドステートメント、一時テーブルなど）が保持されない
- 長時間のトランザクションに適していない
- マイグレーション中にロックが失われる可能性がある

そのため、マイグレーションには **Direct Connection** または **Session Pooler** が必要です。

## 解決方法

### Prisma Schema で `directUrl` を設定する

`prisma/schema.prisma` で `directUrl` を設定することで、マイグレーション時には Direct Connection を使用し、通常のクエリ時には Transaction Pooler を使用できます。

#### 現在の設定（`prisma/schema.prisma:8-12`）

```prisma
datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_DATABASE_URL")
}
```

この設定により：

- `url` (DATABASE_URL) → 通常のクエリ実行に使用
- `directUrl` (DIRECT_DATABASE_URL) → マイグレーション実行時に使用

#### Vercel 環境変数の設定

Vercel Dashboard → Project Settings → Environment Variables で以下を設定：

```env
# 通常のクエリ用：Transaction Pooler（ポート 6543）
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true&sslmode=require"

# マイグレーション用：Direct Connection（ポート 5432）
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
```

**重要なポイント：**

| 接続タイプ         | URL                 | ポート | 用途             | PgBouncer モード |
| ------------------ | ------------------- | ------ | ---------------- | ---------------- |
| Transaction Pooler | DATABASE_URL        | 6543   | 通常のクエリ     | Transaction      |
| Direct Connection  | DIRECT_DATABASE_URL | 5432   | マイグレーション | なし（直接接続） |

### Supabase での接続文字列の取得方法

Supabase Dashboard で接続文字列を取得する際：

1. **Project Settings** → **Database** へ移動
2. **Connection string** セクションで以下を確認：
   - **Transaction pooler** (ポート 6543) → `DATABASE_URL` に設定
   - **Direct connection** または **Session pooler** (ポート 5432) → `DIRECT_DATABASE_URL` に設定

#### Session Pooler と Direct Connection の違い

Supabase では Direct Connection の代わりに Session Pooler（ポート 5432）を使うこともできます：

| 接続タイプ        | 接続数制限                          | 推奨用途                          |
| ----------------- | ----------------------------------- | --------------------------------- |
| Direct Connection | 低い（PostgreSQL の接続上限に依存） | マイグレーションのみ              |
| Session Pooler    | 中程度（PgBouncer 経由でプール）    | マイグレーション + 通常クエリも可 |

**推奨構成：**

```env
# 効率重視：Transaction Pooler + Direct/Session Pooler
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
```

### package.json のビルドスクリプト

`package.json` に `vercel-build` スクリプトが設定されていることを確認してください（`package.json:22`）：

```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

このスクリプトにより：

1. `prisma migrate deploy` が `DIRECT_DATABASE_URL` を使用してマイグレーション実行
2. `next build` でアプリケーションをビルド

## よくある間違い

### ❌ 間違った設定

```env
# 両方とも Transaction Pooler を使用している（マイグレーションが失敗する）
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
```

### ❌ directUrl を設定していない

```prisma
datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    // directUrl が設定されていない
}
```

この場合、マイグレーションも `DATABASE_URL` を使用するため、Transaction Pooler 経由でマイグレーションを実行しようとして失敗します。

### ✅ 正しい設定

```env
# DATABASE_URL: Transaction Pooler（ポート 6543）
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true&sslmode=require"

# DIRECT_DATABASE_URL: Direct/Session Connection（ポート 5432）
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
```

```prisma
datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_DATABASE_URL")
}
```

## ローカル開発環境

ローカル開発では、Docker の PostgreSQL を直接使用するため、両方とも同じ URL で問題ありません：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/djbingo"
DIRECT_DATABASE_URL="postgresql://username:password@localhost:5432/djbingo"
```

## デプロイの確認

設定後、以下を確認してください：

1. Vercel Dashboard で環境変数が正しく設定されているか確認
2. 再デプロイを実行
3. ビルドログで `prisma migrate deploy` が正常に完了しているか確認

```
Running "prisma migrate deploy"
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

1 migration found in prisma/migrations

Applying migration `20240101000000_init`
The following migration(s) have been applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

All migrations have been successfully applied.
✓ Generated Prisma Client
```

## まとめ

- **マイグレーションには Direct Connection または Session Pooler が必須**
- Transaction Pooler はマイグレーションに適していない
- `prisma/schema.prisma` で `directUrl` を必ず設定する
- Vercel で `DATABASE_URL`（Transaction Pooler）と `DIRECT_DATABASE_URL`（Direct/Session）を分ける

## 関連ドキュメント

- [データベース接続エラー](./database-connection-errors.md) - `prepared statement does not exist` エラーの対処法
- [Prisma Documentation - Connection management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Supabase Documentation - Database connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
