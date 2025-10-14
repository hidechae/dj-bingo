# Troubleshooting Guide

このドキュメントでは、DJ Bingo アプリケーションで発生する可能性のある問題とその解決方法をまとめています。

## データベース接続エラー

### Error: "prepared statement does not exist"

#### エラーメッセージの例

```
prisma:error
Invalid `prisma.bingoGame.findUnique()` invocation:

Error occurred during query execution:
ConnectorError(ConnectorError {
  user_facing_error: None,
  kind: QueryError(PostgresError {
    code: "26000",
    message: "prepared statement \"s11\" does not exist",
    severity: "ERROR",
    detail: None,
    column: None,
    hint: None
  }),
  transient: false
})
```

#### 原因

このエラーは PostgreSQL のプリペアドステートメントが存在しないときに発生します。主な原因は以下の通りです：

- **PgBouncer** や接続プーラーがトランザクションモードで動作している
- 特に **Supabase の Transaction Pooler**（ポート 6543）を使用している場合に頻発
- 接続プール内で接続が再利用される際に、プリペアドステートメントが失われる

#### なぜ Supabase で発生するのか？

Supabase は以下の接続方法を提供しています：

| 接続方法           | ポート | モード                | プリペアドステートメント |
| ------------------ | ------ | --------------------- | ------------------------ |
| Transaction Pooler | 6543   | PgBouncer Transaction | ❌ 非対応                |
| Session Pooler     | 5432   | PgBouncer Session     | ✅ 対応                  |
| Direct Connection  | 5432   | Direct                | ✅ 対応                  |

Transaction Pooler は接続効率が良くサーバーレス環境（Vercel など）に最適ですが、トランザクションモードのため、プリペアドステートメントをサポートしていません。

一方、**Neon** などの他のデータベースプロバイダーでは、接続プーラーがプリペアドステートメントに対応しているため、同じ問題は発生しません。

#### 解決方法

**推奨：Transaction Pooler + `pgbouncer=true` パラメータ**

Vercel などのサーバーレス環境では、Transaction Pooler を使い続けることが推奨されます。Prisma に `pgbouncer=true` パラメータを付けることで、プリペアドステートメントを無効化できます。

##### Vercel 環境変数の設定

```env
# クエリ用：Transaction Pooler（ポート 6543）
DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true&sslmode=require"

# マイグレーション用：Direct Connection（ポート 5432）
DIRECT_DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
```

**設定手順：**

1. Vercel Dashboard → Project Settings → Environment Variables
2. `DATABASE_URL` に `?pgbouncer=true&sslmode=require` を追加
3. `DIRECT_DATABASE_URL` に `?sslmode=require` を追加
4. プロジェクトを再デプロイ

##### ローカル開発環境

ローカルの Docker PostgreSQL では SSL 設定が不要な場合が多いため、パラメータなしで問題ありません：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/djbingo"
DIRECT_DATABASE_URL="postgresql://username:password@localhost:5432/djbingo"
```

#### パラメータの説明

| パラメータ        | 説明                                                                | 必要性                               |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------ |
| `pgbouncer=true`  | Prisma がプリペアドステートメントを無効化し、通常のクエリを使用する | Transaction Pooler 使用時は必須      |
| `sslmode=require` | SSL/TLS 暗号化通信を強制する                                        | 本番環境では強く推奨（セキュリティ） |

#### 代替案：Session Pooler に切り替え

もし接続の長寿命化が許容できる環境であれば、Session Pooler（ポート 5432）に切り替えることで `pgbouncer=true` なしでも動作します：

```env
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/postgres?sslmode=require"
```

ただし、Vercel などのサーバーレス環境では **Transaction Pooler の方が効率的** なため、通常は推奨されません。

#### パフォーマンスへの影響

`pgbouncer=true` によるプリペアドステートメント無効化のパフォーマンス影響は、サーバーレス環境ではほぼ無視できます。理由：

- サーバーレス関数は短命で頻繁に起動・終了する
- 接続の確立・切断コストの方がはるかに大きい
- Transaction Pooler による接続再利用の恩恵の方が大きい

#### 関連ファイル

- `prisma/schema.prisma:10-11` - DATABASE_URL と DIRECT_DATABASE_URL の設定
- `src/server/db.ts` - Prisma クライアントの初期化

#### 参考リンク

- [Prisma - Connection pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [Supabase - Database connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
