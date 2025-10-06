# コードリーディングガイド

このドキュメントは、Next.js初心者がDJ Bingoアプリケーションのコードを効率的に読み進めるためのガイドです。

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [コードリーディングの推奨順序](#コードリーディングの推奨順序)
3. [Next.js Pages Routerの理解](#nextjs-pages-routerの理解)
4. [データフローの理解](#データフローの理解-trpc)
5. [認証の仕組み](#認証の仕組み)
6. [主要なユーザーフロー](#主要なユーザーフロー)
7. [データベーススキーマ](#データベーススキーマ)
8. [学習の進め方](#学習の進め方)

## プロジェクト概要

DJ Bingoは、DJイベントで使用できるインタラクティブなビンゴゲームアプリケーションです。

### 技術スタック

- **Next.js 15** (Pages Router)
- **TypeScript**
- **tRPC** - 型安全なAPI通信
- **Prisma** - ORMとデータベース管理
- **NextAuth.js** - 認証（Google OAuth）
- **TanStack Query** - データフェッチとキャッシュ管理
- **Tailwind CSS** - スタイリング

### ディレクトリ構造

```
src/
├── pages/              # Next.jsのページコンポーネント（ルーティング）
│   ├── _app.tsx       # アプリケーション全体のラッパー
│   ├── index.tsx      # トップページ (/)
│   ├── admin/         # 管理者ページ
│   ├── game/          # 参加者ページ
│   └── api/           # APIエンドポイント
├── server/            # バックエンドロジック
│   ├── api/
│   │   ├── root.ts          # tRPCルーターの統合
│   │   ├── trpc.ts          # tRPC設定
│   │   └── routers/         # APIロジック
│   ├── auth.ts        # NextAuth設定
│   └── db.ts          # Prismaクライアント
└── utils/
    └── api.ts         # tRPCクライアント設定

prisma/
└── schema.prisma      # データベーススキーマ定義
```

## コードリーディングの推奨順序

### ステップ1: エントリーポイントを理解する

#### 1.1 `src/pages/_app.tsx`

すべてのページの最上位コンポーネントです。ここで全体的な設定が行われます。

```tsx
const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      {" "}
      {/* 認証状態の管理 */}
      <div className="font-sans">
        <Component {...pageProps} /> {/* 各ページコンポーネント */}
      </div>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp); // tRPCクライアントをアプリ全体で使用可能にする
```

**ポイント:**

- `SessionProvider`: NextAuth.jsの認証状態を全ページで共有
- `api.withTRPC()`: tRPCのHookを全ページで使えるようにする

#### 1.2 `src/pages/index.tsx`

トップページ（`/`）です。ユーザーの入り口となります。

```tsx
const Home: NextPage = () => {
  const { data: session } = useSession();  // ログイン状態を取得

  return (
    // ログインしている場合は「管理者画面」へのリンク
    // ログインしていない場合は「管理者ログイン」へのリンク
    {session ? (
      <Link href="/admin">管理者画面 →</Link>
    ) : (
      <Link href="/auth/signin">管理者ログイン →</Link>
    )}
  );
};
```

**ポイント:**

- `useSession()`: NextAuth.jsのHook、現在のログイン状態を取得
- 条件分岐で表示を切り替え

### ステップ2: APIの設定を理解する

#### 2.1 `src/utils/api.ts`

tRPCクライアントの設定ファイルです。フロントエンドからバックエンドAPIを呼び出す際の基盤となります。

```tsx
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          /* ... */
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`, // APIエンドポイント
          transformer: superjson, // 型変換
        }),
      ],
    };
  },
  ssr: false, // SSRを無効化（クライアントサイドのみ）
});
```

**ポイント:**

- `AppRouter`: バックエンドのルーター型が自動的にインポートされる
- `httpBatchLink`: 複数のAPIリクエストをバッチ処理
- `superjson`: Date、Map、Setなどの複雑な型をシリアライズ

#### 2.2 `src/server/api/root.ts`

すべてのtRPCルーターを統合する場所です。

```tsx
export const appRouter = createTRPCRouter({
  bingo: bingoRouter, // 管理者用API
  participant: participantRouter, // 参加者用API
});

export type AppRouter = typeof appRouter; // 型をエクスポート
```

**ポイント:**

- `appRouter`: すべてのAPIエンドポイントの集合
- 型定義がフロントエンドに自動的に共有される

#### 2.3 `src/server/api/trpc.ts`

tRPCの基本設定と、`protectedProcedure`（認証が必要なAPI）の定義があります。

```tsx
// コンテキストの作成（各リクエストで利用可能なデータ）
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getServerAuthSession({ req, res });

  return {
    session, // 認証情報
    db, // Prismaクライアント
  };
};

// 公開API（認証不要）
export const publicProcedure = t.procedure;

// 保護されたAPI（認証必須）
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

**ポイント:**

- `createTRPCContext`: すべてのAPIで`ctx.session`と`ctx.db`が使える
- `protectedProcedure`: 管理者専用API（未ログインだとエラー）
- `publicProcedure`: 参加者も使えるAPI

## Next.js Pages Routerの理解

Pages Routerでは、`src/pages/`配下のファイル構造がそのままURLになります。

### 基本的なルーティング

| ファイルパス             | URL             |
| ------------------------ | --------------- |
| `pages/index.tsx`        | `/`             |
| `pages/admin/index.tsx`  | `/admin`        |
| `pages/admin/create.tsx` | `/admin/create` |
| `pages/auth/signin.tsx`  | `/auth/signin`  |

### 動的ルーティング

`[]`で囲まれたファイル名は、動的なパラメータを表します。

| ファイルパス                | URL                  | パラメータ     |
| --------------------------- | -------------------- | -------------- |
| `pages/game/[id].tsx`       | `/game/abc123`       | `id: "abc123"` |
| `pages/admin/game/[id].tsx` | `/admin/game/xyz789` | `id: "xyz789"` |

**コード例:**

```tsx
// src/pages/game/[id].tsx
const ParticipantGame: NextPage = () => {
  const router = useRouter();
  const { id } = router.query; // URLパラメータを取得

  // id を使ってAPIを呼び出す
  const { data: bingoGame } = api.bingo.getById.useQuery(
    { id: id as string },
    { enabled: !!id } // idが存在する時だけクエリを実行
  );
};
```

### ネストした動的ルーティング

| ファイルパス                | URL                  |
| --------------------------- | -------------------- |
| `pages/game/[id]/setup.tsx` | `/game/abc123/setup` |
| `pages/game/[id]/play.tsx`  | `/game/abc123/play`  |

## データフローの理解 (tRPC)

tRPCは、TypeScriptの型を共有しながらフロントエンドとバックエンドを繋ぐ仕組みです。

### バックエンド: APIの定義

```tsx
// src/server/api/routers/bingo.ts
export const bingoRouter = createTRPCRouter({
  // ゲーム作成API（認証必須）
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        size: z.nativeEnum(BingoSize),
        songs: z
          .array(
            z.object({
              title: z.string().min(1),
              artist: z.string().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user.id は認証済みユーザーのID
      const bingoGame = await ctx.db.bingoGame.create({
        data: {
          title: input.title,
          size: input.size,
          createdBy: ctx.session.user.id,
          songs: {
            create: input.songs,
          },
        },
      });
      return bingoGame;
    }),

  // ゲーム取得API（認証不要）
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.bingoGame.findUnique({
        where: { id: input.id },
        include: { songs: true, participants: true },
      });
    }),
});
```

**ポイント:**

- `.input()`: Zodでバリデーション（型安全）
- `.mutation()`: データを変更するAPI（POST相当）
- `.query()`: データを取得するAPI（GET相当）

### フロントエンド: APIの呼び出し

```tsx
// src/pages/admin/index.tsx
const AdminDashboard: NextPage = () => {
  // ユーザーのビンゴゲーム一覧を取得
  const { data: bingoGames, isLoading } = api.bingo.getAllByUser.useQuery(
    undefined, // 入力パラメータなし
    { enabled: !!session } // sessionが存在する時のみ実行
  );

  // ゲーム作成
  const createMutation = api.bingo.create.useMutation({
    onSuccess: (data) => {
      console.log("作成されたゲーム:", data);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: "サマーパーティー",
      size: BingoSize.FIVE_BY_FIVE,
      songs: [{ title: "Summer Song", artist: "DJ Cool" }],
    });
  };
};
```

**ポイント:**

- `useQuery`: データ取得、自動キャッシュ、再取得
- `useMutation`: データ変更、成功/失敗のコールバック
- 型が自動推論される（`data`の型はバックエンドから自動）

### tRPCのメリット

1. **型安全**: バックエンドの変更がフロントエンドに即座に反映
2. **APIドキュメント不要**: コードが自己文書化
3. **バリデーション**: Zodで入力検証
4. **自動補完**: IDEで利用可能なAPIが表示される

## 認証の仕組み

### 管理者認証（NextAuth.js + Google OAuth）

#### 設定: `src/server/auth.ts`

```tsx
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id, // セッションにユーザーIDを追加
      },
    }),
  },
  adapter: PrismaAdapter(db), // セッションをDBに保存
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin", // カスタムログインページ
  },
};
```

#### 使用例: `src/pages/admin/index.tsx`

```tsx
const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin"); // 未ログインならログインページへ
    }
  }, [session, status, router]);

  if (!session) return null;

  // 認証済みユーザーのみ表示されるコンテンツ
  return <div>管理者ダッシュボード</div>;
};
```

### 参加者認証（sessionToken）

参加者は認証不要で、`localStorage`に保存された`sessionToken`で識別されます。

#### 生成: `src/pages/game/[id].tsx`

```tsx
const ParticipantGame: NextPage = () => {
  const [sessionToken, setSessionToken] = useState<string>("");

  useEffect(() => {
    // localStorageからトークンを取得、なければ生成
    let token = localStorage.getItem("dj-bingo-session");
    if (!token) {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("dj-bingo-session", token);
    }
    setSessionToken(token);
  }, []);

  // トークンを使ってゲームに参加
  const joinMutation = api.participant.join.useMutation();
  joinMutation.mutate({
    name: participantName,
    bingoGameId: id as string,
    sessionToken,
  });
};
```

#### バックエンドでの検証: `src/server/api/routers/participant.ts`

```tsx
join: publicProcedure
  .input(z.object({
    name: z.string().min(1),
    bingoGameId: z.string(),
    sessionToken: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 既に参加済みかチェック
    const existingParticipant = await ctx.db.participant.findUnique({
      where: { sessionToken: input.sessionToken },
    });

    if (existingParticipant) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Already joined this game",
      });
    }

    // 新規参加者を作成
    const participant = await ctx.db.participant.create({
      data: {
        name: input.name,
        bingoGameId: input.bingoGameId,
        sessionToken: input.sessionToken,
      },
    });

    return participant;
  }),
```

**ポイント:**

- 参加者はGoogleアカウント不要
- `sessionToken`でセッション維持
- ページをリロードしても状態が保持される

## 主要なユーザーフロー

### 管理者フロー

1. **トップページ** (`/`)
   - ファイル: `src/pages/index.tsx`
   - 「管理者ログイン」ボタンをクリック

2. **ログイン** (`/auth/signin`)
   - ファイル: `src/pages/auth/signin.tsx`
   - Google認証でログイン
   - NextAuth.jsが自動的にセッションを管理

3. **管理者ダッシュボード** (`/admin`)
   - ファイル: `src/pages/admin/index.tsx`
   - API: `api.bingo.getAllByUser.useQuery()`
   - 自分が作成したビンゴゲーム一覧を表示

4. **ビンゴゲーム作成** (`/admin/create`)
   - ファイル: `src/pages/admin/create.tsx`
   - API: `api.bingo.create.useMutation()`
   - タイトル、サイズ、楽曲リストを入力

5. **ゲーム管理** (`/admin/game/[id]`)
   - ファイル: `src/pages/admin/game/[id].tsx`
   - API: `api.bingo.getById.useQuery()`, `api.bingo.markSongAsPlayed.useMutation()`
   - 楽曲の演奏状態を更新
   - 参加者の状態を確認
   - QRコード表示

### 参加者フロー

1. **QRコードでアクセス** (`/game/[id]`)
   - ファイル: `src/pages/game/[id].tsx`
   - 名前を入力してゲームに参加
   - API: `api.participant.join.useMutation()`

2. **グリッド設定** (`/game/[id]/setup`)
   - ファイル: `src/pages/game/[id]/setup.tsx`
   - 楽曲リストから選択してビンゴグリッドに配置
   - API: `api.participant.setupGrid.useMutation()`

3. **ゲームプレイ** (`/game/[id]/play`)
   - ファイル: `src/pages/game/[id]/play.tsx`
   - API: `api.participant.getBySessionToken.useQuery()`（ポーリング）
   - リアルタイムで楽曲の演奏状態を確認
   - ビンゴ達成時に自動通知

## データベーススキーマ

### ER図（概念図）

```
User (管理者)
  │
  └─── BingoGame (1:N)
         │
         ├─── Song (1:N)
         │      │
         │      └─── ParticipantSong (1:N)
         │             │
         └─── Participant (1:N) ──┘
```

### 主要なテーブル

#### BingoGame

```prisma
model BingoGame {
  id          String      @id @default(cuid())
  title       String
  size        BingoSize   // THREE_BY_THREE | FOUR_BY_FOUR | FIVE_BY_FIVE
  createdBy   String
  user        User        @relation(fields: [createdBy], references: [id])
  songs       Song[]
  participants Participant[]
  isActive    Boolean     @default(true)
}
```

#### Song

```prisma
model Song {
  id          String      @id @default(cuid())
  title       String
  artist      String?
  bingoGameId String
  bingoGame   BingoGame   @relation(fields: [bingoGameId], references: [id])
  isPlayed    Boolean     @default(false)  // DJが演奏済みかどうか
  playedAt    DateTime?
  participantSongs ParticipantSong[]
}
```

#### Participant

```prisma
model Participant {
  id              String      @id @default(cuid())
  name            String
  sessionToken    String      @unique  // localStorage由来の一意なトークン
  bingoGameId     String
  bingoGame       BingoGame   @relation(fields: [bingoGameId], references: [id])
  isGridComplete  Boolean     @default(false)  // グリッド設定完了
  hasWon          Boolean     @default(false)  // ビンゴ達成
  wonAt           DateTime?
  participantSongs ParticipantSong[]
}
```

#### ParticipantSong（中間テーブル）

```prisma
model ParticipantSong {
  id            String      @id @default(cuid())
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id])
  songId        String
  song          Song        @relation(fields: [songId], references: [id])
  position      Int         // グリッド内の位置 (0-8 for 3x3, 0-15 for 4x4, etc.)

  @@unique([participantId, position])  // 同じ位置に複数の楽曲を配置できない
}
```

### グリッドの位置システム

- **3x3グリッド**: position は 0〜8

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

- **4x4グリッド**: position は 0〜15
- **5x5グリッド**: position は 0〜24

## 学習の進め方

### 初心者向け: 1つのフローを完全に追う

**「参加者が参加してビンゴをプレイするまで」**を読むのがおすすめです。

#### ステップ1: エントリーポイント

`src/pages/game/[id].tsx`を開く

- `useRouter()`でURLパラメータ取得
- `localStorage`でsessionToken生成/取得
- `useEffect`でリダイレクトロジック

#### ステップ2: API呼び出し

`src/server/api/routers/participant.ts`の`join`メソッドを読む

- Zodバリデーション
- Prismaでデータベース操作
- エラーハンドリング

#### ステップ3: グリッド設定

`src/pages/game/[id]/setup.tsx`を読む

- 楽曲リストの表示
- ドラッグ&ドロップ（またはクリック選択）
- `setupGrid` mutation

#### ステップ4: プレイ画面

`src/pages/game/[id]/play.tsx`を読む

- ポーリングによるリアルタイム更新
- ビンゴ判定ロジック

### 中級者向け: アーキテクチャパターンを理解する

1. **tRPCの型推論**
   - `src/utils/api.ts:34-35`の`RouterInputs`と`RouterOutputs`
   - フロントエンドで型を明示的に指定する方法

2. **Prismaのリレーション**
   - `prisma/schema.prisma`の`@relation`
   - `include`と`select`の使い分け

3. **NextAuth.jsのカスタマイズ**
   - `src/server/auth.ts`のcallbacks
   - セッションに追加データを含める方法

4. **環境変数の型安全な管理**
   - `src/env.js`（T3 Stackの特徴）
   - `.env`の値を型チェック

### コードリーディングのコツ

1. **上から下ではなく、フローで読む**
   - ユーザーの行動に沿ってコードを追う
   - 1つの機能を完全に理解してから次へ

2. **型定義を見る**
   - TypeScriptの型からデータ構造が分かる
   - `type`, `interface`, Zodスキーマを確認

3. **console.logを追加する**
   - どのタイミングでデータが流れるか確認
   - `useEffect`の依存配列の動きを理解

4. **ドキュメントを並行して読む**
   - [Next.js公式ドキュメント](https://nextjs.org/docs)
   - [tRPC公式ドキュメント](https://trpc.io/docs)
   - [Prisma公式ドキュメント](https://www.prisma.io/docs)

## まとめ

このプロジェクトは、モダンなフルスタックアプリケーションの典型例です。以下を学べます:

- **Next.js Pages Router**: ファイルベースルーティング
- **tRPC**: 型安全なAPI通信
- **Prisma**: ORMによるデータベース操作
- **NextAuth.js**: 認証フロー
- **TanStack Query**: 状態管理とキャッシング

1つずつ丁寧に読み進めることで、モダンなWeb開発の全体像が掴めるはずです。
