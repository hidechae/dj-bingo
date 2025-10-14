# アプリケーションアーキテクチャ

このドキュメントは、DJ Bingoアプリケーションの全体的なアーキテクチャと設計思想を説明します。

## 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ図](#アーキテクチャ図)
4. [レイヤー構成](#レイヤー構成)
5. [ディレクトリ構造](#ディレクトリ構造)
6. [データフロー](#データフロー)
7. [認証・認可](#認証認可)
8. [状態管理](#状態管理)
9. [リアルタイム更新](#リアルタイム更新)
10. [設計の特徴と利点](#設計の特徴と利点)

## システム概要

DJ Bingoは、DJイベント向けのリアルタイムビンゴゲームプラットフォームです。

### 主要な機能

**管理者側:**

- Google OAuthまたはEmail/Passwordによる認証
- ビンゴゲームの作成・管理
- ゲームステータス管理（編集中、エントリー中、ゲーム中、終了）
- 楽曲リストの設定
- 楽曲の演奏状態管理
- 参加者の状況確認
- 共同管理者の追加
- QRコード生成

**参加者側:**

- 認証不要の簡易参加
- ビンゴグリッドへの楽曲配置
- リアルタイムでの演奏状況確認
- 自動ビンゴ判定
- セッション永続化

## 技術スタック

### フロントエンド

| 技術               | バージョン | 用途                                   |
| ------------------ | ---------- | -------------------------------------- |
| **Next.js**        | 15.5.0     | Reactフレームワーク、ルーティング、SSR |
| **React**          | 19.0.0     | UIコンポーネント構築                   |
| **TypeScript**     | 5.6.2      | 型安全性の確保                         |
| **Tailwind CSS**   | 4.1.14     | スタイリング                           |
| **TanStack Query** | 5.56.2     | データフェッチ、キャッシュ管理         |

### バックエンド

| 技術            | バージョン | 用途                                 |
| --------------- | ---------- | ------------------------------------ |
| **tRPC**        | 11.0.0-rc  | 型安全なAPI通信                      |
| **Prisma**      | 6.0.0      | ORM、データベース管理                |
| **NextAuth.js** | 4.24.8     | 認証（Google OAuth、Email/Password） |
| **PostgreSQL**  | 15+        | データベース                         |
| **Zod**         | 4.0.0      | スキーマバリデーション               |
| **SuperJSON**   | 2.2.1      | シリアライゼーション                 |
| **bcryptjs**    | 3.0.2      | パスワードハッシュ化                 |

### インフラ

| 環境         | 技術                                                             |
| ------------ | ---------------------------------------------------------------- |
| **ローカル** | Docker Compose（PostgreSQL）                                     |
| **本番**     | Supabase（PostgreSQL）+ Vercel、またはNeon（PostgreSQL）+ Vercel |

## アーキテクチャ図

### システム全体図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 管理者ページ  │  │ 参加者ページ  │  │  認証ページ   │      │
│  │  /admin/*    │  │  /game/*     │  │ /auth/signin │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         └──────────────────┴───────────────────┘             │
│                            │                                 │
│                   ┌────────▼─────────┐                       │
│                   │  tRPC Client     │                       │
│                   │  (型安全なAPI)    │                       │
│                   └────────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP (JSON)
┌────────────────────────────▼─────────────────────────────────┐
│                      Next.js Server                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          API Layer (tRPC Routers)                    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │  ┌─────────────────┐    ┌──────────────────────┐   │   │
│  │  │  bingoRouter    │    │ participantRouter    │   │   │
│  │  │                 │    │                      │   │   │
│  │  │ - create        │    │ - join               │   │   │
│  │  │ - getById       │    │ - setupGrid          │   │   │
│  │  │ - getAllByUser  │    │ - checkWin           │   │   │
│  │  │ - markAsPlayed  │    │ - getBySessionToken  │   │   │
│  │  └─────────────────┘    └──────────────────────┘   │   │
│  │                                                       │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │         Business Logic & Validation                   │   │
│  │         - Zodスキーマバリデーション                     │   │
│  │         - ビンゴ判定ロジック                           │   │
│  │         - 権限チェック (protectedProcedure)           │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │              Data Access Layer                        │   │
│  │              Prisma ORM                               │   │
│  └───────────────────────┬───────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                        │
│                                                               │
│  ┌────────┐  ┌──────┐  ┌────────────┐  ┌─────────────────┐ │
│  │  User  │  │ Song │  │ BingoGame  │  │  Participant    │ │
│  └───┬────┘  └──────┘  └─────┬──────┘  └─────────────────┘ │
│      │                        │                              │
│      │                  ┌─────▼──────┐                      │
│      └──────────────────┤ GameAdmin  │                      │
│                         └────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 認証フロー

```
┌─────────────┐
│  管理者     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ /auth/signin    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ NextAuth.js     │─────▶│  Google OAuth    │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│ セッション生成   │
│ (DB保存)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /admin          │
│ 管理者画面       │
└─────────────────┘


┌─────────────┐
│  参加者     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ /game/[id]      │
│ (QRコード経由)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ localStorage    │
│ sessionToken    │
│ 生成/取得       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 名前入力のみ     │
│ (認証不要)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /game/[id]/setup│
│ グリッド設定     │
└─────────────────┘
```

## レイヤー構成

### 1. プレゼンテーション層 (Presentation Layer)

**場所:** `src/pages/`

**責務:**

- UIの表示
- ユーザー入力の受付
- ルーティング
- クライアントサイドの状態管理

**主要コンポーネント:**

- ページコンポーネント (`index.tsx`, `admin/*.tsx`, `game/*.tsx`)
- NextAuthのセッション管理
- TanStack Queryのキャッシュ管理

### 2. API層 (API Layer)

**場所:** `src/server/api/routers/`

**責務:**

- APIエンドポイントの定義
- 入力バリデーション（Zod）
- ビジネスロジックの実行
- レスポンスの整形

**主要モジュール:**

- `bingoRouter`: 管理者用API
- `participantRouter`: 参加者用API

### 3. ビジネスロジック層 (Business Logic Layer)

**場所:** API層に統合（`src/server/api/routers/`内）

**責務:**

- ビンゴ判定アルゴリズム
- 権限チェック
- データ整合性の保証
- エラーハンドリング

### 4. データアクセス層 (Data Access Layer)

**場所:** Prisma経由でアクセス

**責務:**

- データベースCRUD操作
- リレーションの解決
- トランザクション管理

**主要モジュール:**

- `src/server/db.ts`: Prismaクライアント
- `prisma/schema.prisma`: スキーマ定義

### 5. 認証層 (Authentication Layer)

**場所:** `src/server/auth.ts`, `src/server/api/trpc.ts`

**責務:**

- 管理者認証（Google OAuth）
- セッション管理
- 参加者識別（sessionToken）
- APIアクセス制御

## ディレクトリ構造

```
dj-bingo/
├── prisma/
│   └── schema.prisma              # データベーススキーマ定義
│
├── src/
│   ├── env.js                     # 環境変数の型定義と検証
│   │
│   ├── pages/                     # Next.js Pages Router
│   │   ├── _app.tsx              # アプリケーションのルート
│   │   ├── index.tsx             # トップページ (/)
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth].ts  # NextAuth.jsエンドポイント
│   │   │   └── trpc/
│   │   │       └── [trpc].ts     # tRPCエンドポイント
│   │   │
│   │   ├── admin/                # 管理者ページ
│   │   │   ├── index.tsx         # ダッシュボード (/admin)
│   │   │   ├── create.tsx        # ゲーム作成 (/admin/create)
│   │   │   └── game/
│   │   │       └── [id].tsx      # ゲーム管理 (/admin/game/:id)
│   │   │
│   │   ├── auth/
│   │   │   └── signin.tsx        # ログインページ (/auth/signin)
│   │   │
│   │   └── game/                 # 参加者ページ
│   │       ├── [id].tsx          # 参加ページ (/game/:id)
│   │       └── [id]/
│   │           ├── setup.tsx     # グリッド設定 (/game/:id/setup)
│   │           └── play.tsx      # プレイ画面 (/game/:id/play)
│   │
│   ├── server/                    # バックエンドロジック
│   │   ├── api/
│   │   │   ├── root.ts           # tRPCルーターの統合
│   │   │   ├── trpc.ts           # tRPC設定、middleware
│   │   │   └── routers/          # APIロジック
│   │   │       ├── bingo.ts      # 管理者用API
│   │   │       └── participant.ts # 参加者用API
│   │   │
│   │   ├── auth.ts               # NextAuth.js設定
│   │   └── db.ts                 # Prismaクライアント
│   │
│   ├── styles/
│   │   └── globals.css           # グローバルスタイル
│   │
│   └── utils/
│       └── api.ts                # tRPCクライアント設定
│
├── docker-compose.yml             # ローカルPostgreSQL
├── .env.example                   # 環境変数テンプレート
├── package.json                   # 依存関係
└── tsconfig.json                  # TypeScript設定
```

## データフロー

### 管理者がゲームを作成する流れ

```
1. ユーザー操作
   /admin/create ページでフォーム入力
   ↓
2. フロントエンド (src/pages/admin/create.tsx)
   createMutation.mutate({ title, size, songs })
   ↓
3. tRPCクライアント (src/utils/api.ts)
   POST /api/trpc/bingo.create
   ↓
4. tRPCサーバー (src/pages/api/trpc/[trpc].ts)
   リクエストをルーターに転送
   ↓
5. APIルーター (src/server/api/routers/bingo.ts)
   - protectedProcedure で認証チェック
   - Zod で入力バリデーション
   - ビジネスロジック実行
   ↓
6. Prismaクライアント (src/server/db.ts)
   ctx.db.bingoGame.create({ ... })
   ↓
7. PostgreSQL
   データ保存
   ↓
8. レスポンス
   作成されたBingoGameオブジェクトを返す
   ↓
9. フロントエンド
   onSuccess コールバック実行
   キャッシュ更新
   ページ遷移
```

### 参加者がビンゴをプレイする流れ

```
1. QRコードスキャン
   /game/[id] にアクセス
   ↓
2. sessionToken 生成/取得 (localStorage)
   ↓
3. 名前入力 & 参加
   api.participant.join.useMutation()
   ↓
4. バックエンド (src/server/api/routers/participant.ts)
   - sessionToken の重複チェック
   - Participant レコード作成
   ↓
5. グリッド設定ページへ遷移
   /game/[id]/setup
   ↓
6. 楽曲選択 & グリッド配置
   api.participant.setupGrid.useMutation()
   ↓
7. バックエンド
   - ParticipantSong レコード作成（position付き）
   - isGridComplete = true
   ↓
8. プレイ画面へ遷移
   /game/[id]/play
   ↓
9. リアルタイム更新（ポーリング）
   api.participant.getBySessionToken.useQuery(
     { refetchInterval: 3000 }  // 3秒ごと
   )
   ↓
10. 管理者が楽曲を「演奏済み」にする
    api.bingo.markSongAsPlayed.useMutation()
    ↓
11. 参加者画面が自動更新
    ポーリングで新しいデータ取得
    ↓
12. ビンゴ判定
    api.participant.checkWin.useMutation()
    ↓
13. ビンゴ達成
    hasWon = true, wonAt = now()
```

## 認証・認可

### 管理者認証

**技術:** NextAuth.js + Google OAuth / Email & Password

**フロー:**

1. ユーザーが `/auth/signin` にアクセス
2. 認証方法を選択
   - **Google OAuth**: Googleアカウントでログイン
   - **Email/Password**: メールアドレスとパスワードでログイン（bcryptjsでハッシュ化）
3. 認証成功後、NextAuth.jsがセッションをDBに保存
4. `useSession()` で認証状態を取得

**実装箇所:**

- 設定: `src/server/auth.ts`
- エンドポイント: `src/pages/api/auth/[...nextauth].ts`
- クライアント: `useSession()` from `next-auth/react`

**保護されたAPI:**

```typescript
// src/server/api/trpc.ts
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session } });
});
```

### 参加者識別

**技術:** localStorage + sessionToken

**フロー:**

1. 初回アクセス時に`sessionToken`を生成
2. `localStorage`に保存
3. APIリクエストに含めて送信
4. DBの`Participant.sessionToken`で識別

**メリット:**

- 認証不要（参加の障壁が低い）
- リロードしても状態が保持される
- QRコードだけで参加可能

**セキュリティ考慮:**

- 参加者は自分のデータのみアクセス可能
- sessionTokenは推測困難
- ゲームごとに1回のみ参加可能

## 状態管理

### クライアントサイド

**TanStack Query (React Query)**を使用

```typescript
// データ取得（キャッシュあり）
const { data, isLoading } = api.bingo.getById.useQuery({ id });

// データ変更
const mutation = api.bingo.create.useMutation({
  onSuccess: () => {
    // キャッシュを無効化して再取得
    utils.bingo.getAllByUser.invalidate();
  },
});
```

**特徴:**

- 自動キャッシュ管理
- 重複リクエストの削減
- バックグラウンド更新
- 楽観的更新（Optimistic Updates）対応可能

### サーバーサイド

**Prisma + PostgreSQL**

- データはすべてデータベースに保存
- tRPCのコンテキストで`ctx.db`経由でアクセス
- トランザクションサポート

## リアルタイム更新

### 現在の実装: ポーリング

```typescript
// 3秒ごとにデータを再取得
const { data: participant } = api.participant.getBySessionToken.useQuery(
  { sessionToken },
  {
    refetchInterval: 3000, // 3秒ごと
    enabled: !!sessionToken,
  }
);
```

**メリット:**

- 実装がシンプル
- 追加のインフラ不要

**デメリット:**

- 遅延がある（最大3秒）
- サーバー負荷が高い

### 将来の改善案: WebSocket (tRPC Subscriptions)

tRPCは`subscription`をサポートしており、WebSocketによるリアルタイム通信が可能です。

```typescript
// 例: 将来的な実装イメージ
export const bingoRouter = createTRPCRouter({
  onSongPlayed: publicProcedure
    .input(z.object({ bingoGameId: z.string() }))
    .subscription(async ({ input }) => {
      // EventEmitterやPubSubを使用
      return observable((emit) => {
        // 楽曲が演奏されたらイベント発火
      });
    }),
});
```

## 設計の特徴と利点

### 1. 型安全性

**tRPC + TypeScript**により、エンドツーエンドの型安全性を実現。

```typescript
// バックエンド
export const bingoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ input }) => {
      return await ctx.db.bingoGame.create({ ... });
    }),
});

// フロントエンド（型が自動推論される）
const mutation = api.bingo.create.useMutation();
mutation.mutate({ title: "パーティー" }); // ✅ OK
mutation.mutate({ name: "パーティー" });  // ❌ 型エラー
```

### 2. コロケーション

関連するコードが近くに配置されている。

- ページコンポーネント: `src/pages/admin/game/[id].tsx`
- APIロジック: `src/server/api/routers/bingo.ts`

### 3. 宣言的データフェッチ

```typescript
// ローディング状態、エラー、データを自動管理
const { data, isLoading, error } = api.bingo.getById.useQuery({ id });

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
return <GameDetails game={data} />;
```

### 4. スケーラビリティ

- ページ単位でコード分割（自動）
- APIルーターを分割可能
- Prismaでデータベース移行が容易

### 5. 開発者体験（DX）

- ホットリロード
- TypeScriptによる自動補完
- Prisma Studioでデータベース確認
- 型エラーによる早期バグ検出

## データベース設計の補足

### 重要なスキーマ変更

#### GameStatus Enum

ゲームのライフサイクルを管理するステータス：

```prisma
enum GameStatus {
  EDITING  @map("editing")  // 編集中: 楽曲リストを編集中
  ENTRY    @map("entry")    // エントリー中: 参加者受付中
  PLAYING  @map("playing")  // ゲーム中: プレイ中
  FINISHED @map("finished") // 終了: ゲーム終了
}
```

#### GameAdmin モデル

複数の管理者でゲームを共同管理できる機能：

```prisma
model GameAdmin {
  id          String    @id @default(cuid())
  bingoGameId String
  bingoGame   BingoGame @relation(fields: [bingoGameId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  addedBy     String    // 追加した管理者のID
  addedAt     DateTime  @default(now())

  @@unique([bingoGameId, userId])  // 同じユーザーを重複して追加できない
}
```

#### Participant の複合ユニーク制約

同じ参加者が同じゲームに複数回参加できないようにする：

```prisma
model Participant {
  // ...
  @@unique([sessionToken, bingoGameId])
}
```

### 本番環境のデータベース構成

#### Supabase 使用時（推奨）

```
環境変数の設定:
- DATABASE_URL: Transaction Pooler（ポート 6543）+ pgbouncer=true
- DIRECT_DATABASE_URL: Direct/Session Connection（ポート 5432）

理由:
- Transaction Pooler: サーバーレス環境での接続効率化
- Direct Connection: マイグレーション実行用
```

詳細は [トラブルシューティング > データベース接続エラー](./troubleshooting/database-connection-errors.md) を参照。

## まとめ

DJ Bingoは、モダンなフルスタックアーキテクチャの実例です。

**主要な設計原則:**

- **型安全性**: TypeScript + tRPCで実現
- **シンプルさ**: 最小限の技術スタックで最大の効果
- **開発効率**: T3 Stackによる高いDX
- **保守性**: 明確なレイヤー分離とディレクトリ構造
- **柔軟性**: ゲームステータス管理と共同管理者機能

このアーキテクチャは、小〜中規模のアプリケーションに最適であり、必要に応じてスケールアップ可能です。

## 関連ドキュメント

- [コードリーディングガイド](./code-reading-guide.md) - コードの詳細な読み方
- [ユーザーフロー詳細](./user-flows.md) - 各機能の詳細なフロー
- [トラブルシューティング](./troubleshooting/README.md) - よくある問題と解決方法
