# Troubleshooting

DJ Bingo アプリケーションで発生する可能性のある問題とその解決方法をまとめています。

## ドキュメント一覧

### データベース

- [データベース接続エラー](./database-connection-errors.md)
  - `prepared statement does not exist` エラー
  - Supabase Transaction Pooler の設定
  - `pgbouncer=true` パラメータの使い方

- [Vercel デプロイ時のマイグレーションタイムアウト](./migration-timeout.md)
  - `prisma migrate deploy` で処理が止まる問題
  - Transaction Pooler でマイグレーションが失敗する原因
  - `directUrl` の設定方法

---

問題が解決しない場合は、[GitHub Issues](https://github.com/hidechae/dj-bingo/issues) で報告してください。
