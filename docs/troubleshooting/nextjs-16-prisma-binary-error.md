# Next.js v16アップグレード後のPrisma Query Engineエラー

## 障害概要

### 発生日時

2025年10月29日 02:35 (JST) - Next.js v16へのアップグレード直後

### 影響範囲

- **環境**: Vercel本番環境
- **影響**: 全てのPrisma Clientを使用するAPIエンドポイントが500エラー
- **ローカル環境**: 影響なし

### エラーメッセージ

```
Invalid `prisma.bingoGame.findMany()` invocation:

Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".

This is likely caused by tooling that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" to the deployment folder.
Ensure that you ran `prisma generate` and that "libquery_engine-rhel-openssl-3.0.x.so.node" has been copied to "node_modules/.prisma/client".

The following locations have been searched:
  /var/task/node_modules/.prisma/client
  /var/task/node_modules/@prisma/client
  /vercel/path0/node_modules/@prisma/client
```

## 原因調査

### タイムライン

1. **2025-10-29 00:31** - Prisma v6.18.0へのアップデート (PR #88)
2. **2025-10-29 02:35** - Next.js v16へのアップグレード (commit: fe5bd46)
3. **2025-10-29 02:57** - 本番環境でエラー発生を確認

### 根本原因

Next.js v16へのアップグレードにより、Vercelのデプロイ環境が変更されたことが原因。

#### 1. Next.js v16の要件変更

- **Node.js要件**: 20.9.0以上が必須
- Vercelでは自動的に**Node.js 22.x**が選択される

#### 2. Vercelランタイム環境の変更

- **Node.js 22.x**: Amazon Linux 2023ベース（RHEL互換）
- **OpenSSL**: 3.0.x を使用
- **必要なバイナリ**: `rhel-openssl-3.0.x`

#### 3. Next.js v15との違い

| 項目                 | Next.js v15            | Next.js v16                  |
| -------------------- | ---------------------- | ---------------------------- |
| Node.js要件          | 18.17.0以上            | 20.9.0以上                   |
| Vercelデフォルト     | Node.js 18.x/20.x      | Node.js 22.x                 |
| ランタイムベース     | 旧Amazon Linux         | Amazon Linux 2023 (RHEL互換) |
| OpenSSL              | 1.1.x                  | 3.0.x                        |
| 必要なPrismaバイナリ | debian-openssl-1.1.x等 | rhel-openssl-3.0.x           |

#### 4. Prismaのバイナリターゲット

Prisma Clientは実行環境に応じた適切なQuery Engineバイナリが必要。
`binaryTargets`を明示的に指定しない場合、ローカル環境（`native`）のバイナリのみが生成される。

## 解決策

### 1. Prisma Schemaの修正

`prisma/schema.prisma`の`generator client`セクションに`binaryTargets`を追加:

```prisma
generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

- `"native"`: ローカル開発環境用（macOS/Windows/Linux）
- `"rhel-openssl-3.0.x"`: Vercel本番環境用（Node.js 22.x on Amazon Linux 2023）

### 2. package.jsonへのNode.jsバージョン指定（推奨）

Next.js v16の要件を明示的に指定:

```json
{
  "engines": {
    "node": ">=20.9.0"
  }
}
```

### 3. デプロイ手順

```bash
# Prisma Clientを再生成
npx prisma generate

# 変更をコミット
git add prisma/schema.prisma package.json
git commit -m "fix: Add Vercel binary target for Next.js 16 runtime"

# プッシュ（Vercelで自動デプロイ）
git push
```

## 予防策

### 今後の対応

1. **メジャーバージョンアップ時の確認事項**
   - ランタイム要件の変更を確認
   - デプロイ環境の変更を確認
   - 依存ライブラリのバイナリ要件を確認

2. **Prismaのベストプラクティス**
   - 本番環境が明確な場合は、常に`binaryTargets`を明示的に指定
   - 複数環境で動作させる場合は、全ての環境のターゲットを列挙

3. **モニタリング**
   - デプロイ後の本番環境での動作確認を徹底
   - エラーログの監視

## 参考資料

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Vercel Node.js Versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Prisma Binary Targets](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#binarytargets-options)
- [Prisma 6.18.0 Release Notes](https://github.com/prisma/prisma/releases/tag/6.18.0)

## 関連コミット

- `fe5bd46` - Next.js v16へのアップグレード
- `1f7b669` - Prisma v6.18.0へのアップデート
