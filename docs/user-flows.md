# ユーザーフロー詳細

このドキュメントは、DJ Bingoアプリケーションにおける主要なユーザーフローを詳細に説明します。

## 目次

1. [管理者フロー](#管理者フロー)
   - [ログイン](#1-ログイン)
   - [ダッシュボード](#2-ダッシュボード)
   - [ビンゴゲーム作成](#3-ビンゴゲーム作成)
   - [ゲーム管理](#4-ゲーム管理)
2. [参加者フロー](#参加者フロー)
   - [ゲーム参加](#1-ゲーム参加)
   - [グリッド設定](#2-グリッド設定)
   - [ゲームプレイ](#3-ゲームプレイ)
3. [リアルタイム同期フロー](#リアルタイム同期フロー)
4. [エラーハンドリング](#エラーハンドリング)

---

## 管理者フロー

### 1. ログイン

#### フローチャート

```
開始
  ↓
トップページ (/)
  ↓
「管理者ログイン」クリック
  ↓
/auth/signin
  ↓
認証方法を選択
  ├─ Googleでログイン
  │    ↓
  │  Google OAuth認証画面
  │    ↓
  │  認証成功
  ├─ Spotify OAuthでログイン
  │    ↓
  │  Spotify認証画面
  │    ↓
  │  認証成功
  └─ Magic Linkでログイン
       ↓
     メールアドレス入力
       ↓
     ログインリンクをメールで受信
       ↓
     認証成功
  ↓
NextAuth.jsがセッション作成
  ↓
/admin にリダイレクト
  ↓
終了
```

#### 関連ファイル

| ファイルパス                          | 役割                                           |
| ------------------------------------- | ---------------------------------------------- |
| `src/pages/index.tsx`                 | トップページ、ログイン状態に応じて表示切り替え |
| `src/pages/auth/signin.tsx`           | カスタムログインページ                         |
| `src/server/auth.ts`                  | NextAuth.js設定、Google Providerの設定         |
| `src/pages/api/auth/[...nextauth].ts` | NextAuth.jsのAPIエンドポイント                 |

#### 重要なコード

**`src/pages/index.tsx` - ログイン状態の確認**

```tsx
const Home: NextPage = () => {
  const { data: session } = useSession();  // NextAuth.jsから認証状態を取得

  return (
    {session ? (
      // ログイン済み: 管理者画面へのリンク
      <Link href="/admin">管理者画面 →</Link>
    ) : (
      // 未ログイン: ログインページへのリンク
      <Link href="/auth/signin">管理者ログイン →</Link>
    )}
  );
};
```

**`src/server/auth.ts` - 認証設定**

```tsx
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db), // セッションをDBに保存
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    // Email & Password (bcryptjsでハッシュ化)
    CredentialsProvider({
      // メールアドレスとパスワードで認証
    }),
  ],
  pages: {
    signIn: "/auth/signin", // カスタムログインページ
  },
};
```

#### 状態遷移

| 状態                           | 説明             |
| ------------------------------ | ---------------- |
| `status === "loading"`         | 認証状態を確認中 |
| `status === "unauthenticated"` | 未ログイン       |
| `status === "authenticated"`   | ログイン済み     |

---

### 2. ダッシュボード

#### フローチャート

```
/admin にアクセス
  ↓
認証チェック (useSession)
  ├─ 未ログイン → /auth/signin へリダイレクト
  └─ ログイン済み
       ↓
api.bingo.getAllByUser.useQuery() 実行
  ↓
自分が作成したビンゴゲーム一覧を取得
  ↓
ゲームカードを表示
  ├─ 「管理」リンク → /admin/game/[id]
  └─ 「参加用URL」リンク → /game/[id]
```

#### 関連ファイル

| ファイルパス                      | 役割                     |
| --------------------------------- | ------------------------ |
| `src/pages/admin/index.tsx`       | 管理者ダッシュボード     |
| `src/server/api/routers/bingo.ts` | `getAllByUser` APIの実装 |

#### 重要なコード

**`src/pages/admin/index.tsx` - ゲーム一覧の取得**

```tsx
const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const { data: bingoGames, isLoading } = api.bingo.getAllByUser.useQuery(
    undefined,
    { enabled: !!session }  // ログイン済みの場合のみ実行
  );

  // 未ログイン時はリダイレクト
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  // ゲーム一覧を表示
  return (
    {bingoGames?.map((game) => (
      <div key={game.id}>
        <h3>{game.title}</h3>
        <Link href={`/admin/game/${game.id}`}>管理</Link>
        <Link href={`/game/${game.id}`}>参加用URL</Link>
      </div>
    ))}
  );
};
```

**`src/server/api/routers/bingo.ts` - getAllByUser API**

```tsx
getAllByUser: protectedProcedure  // 認証必須
  .query(async ({ ctx }) => {
    return await ctx.db.bingoGame.findMany({
      where: { createdBy: ctx.session.user.id },  // 自分が作成したゲームのみ
      include: {
        songs: true,
        participants: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),
```

---

### 3. ビンゴゲーム作成

#### フローチャート

```
/admin/create にアクセス
  ↓
フォーム入力
  ├─ タイトル
  ├─ サイズ (3x3, 4x4, 5x5)
  └─ 楽曲リスト (title, artist)
     ├─ 入力フィールド表示
     └─ 「楽曲を追加」ボタンで行追加
  ↓
「ビンゴを作成」ボタンクリック
  ↓
api.bingo.create.useMutation() 実行
  ↓
バックエンドでバリデーション
  ├─ タイトルが空でないか
  ├─ 楽曲数が十分か
  │   ├─ 3x3: 最低9曲
  │   ├─ 4x4: 最低16曲
  │   └─ 5x5: 最低25曲
  └─ OK
       ↓
DBにBingoGame + Songレコード作成
  ↓
作成成功
  ↓
/admin/game/[id] へリダイレクト
```

#### 関連ファイル

| ファイルパス                      | 役割               |
| --------------------------------- | ------------------ |
| `src/pages/admin/create.tsx`      | ゲーム作成フォーム |
| `src/server/api/routers/bingo.ts` | `create` APIの実装 |

#### 重要なコード

**`src/pages/admin/create.tsx` - フォーム送信**

```tsx
const AdminCreate: NextPage = () => {
  const [title, setTitle] = useState("");
  const [size, setSize] = useState<BingoSize>(BingoSize.THREE_BY_THREE);
  const [songs, setSongs] = useState<{ title: string; artist?: string }[]>([]);

  const createMutation = api.bingo.create.useMutation({
    onSuccess: (data) => {
      // 作成成功: 管理画面へ遷移
      void router.push(`/admin/game/${data.id}`);
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title, size, songs });
  };
};
```

**`src/server/api/routers/bingo.ts` - create API**

```tsx
create: protectedProcedure
  .input(
    z.object({
      title: z.string().min(1),
      size: z.nativeEnum(BingoSize),
      songs: z.array(
        z.object({
          title: z.string().min(1),
          artist: z.string().optional(),
        })
      ).min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const bingoGame = await ctx.db.bingoGame.create({
      data: {
        title: input.title,
        size: input.size,
        createdBy: ctx.session.user.id,
        songs: {
          create: input.songs,  // 楽曲も同時に作成
        },
      },
      include: {
        songs: true,
        participants: true,
      },
    });

    return bingoGame;
  }),
```

---

### 4. ゲーム管理

#### フローチャート

```
/admin/game/[id] にアクセス
  ↓
api.bingo.getById.useQuery() でゲーム情報取得
  ├─ ゲーム情報
  ├─ 楽曲リスト
  └─ 参加者リスト
  ↓
画面表示
  ├─ QRコード (参加用URL)
  ├─ 楽曲リスト
  │   └─ 各楽曲に「演奏済み」チェックボックス
  └─ 参加者リスト
      ├─ 名前
      ├─ グリッド設定完了状態
      └─ ビンゴ達成状態
  ↓
楽曲を「演奏済み」にする
  ↓
api.bingo.markSongAsPlayed.useMutation()
  ↓
DBのSong.isPlayedをtrueに更新
  ↓
参加者画面に反映（ポーリングで自動更新）
```

#### 関連ファイル

| ファイルパス                      | 役割                              |
| --------------------------------- | --------------------------------- |
| `src/pages/admin/game/[id].tsx`   | ゲーム管理画面                    |
| `src/server/api/routers/bingo.ts` | `getById`, `markSongAsPlayed` API |

#### 重要なコード

**`src/pages/admin/game/[id].tsx` - 楽曲の演奏状態更新**

```tsx
const AdminGameManage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const { data: game } = api.bingo.getById.useQuery({ id: id as string });

  const markAsPlayedMutation = api.bingo.markSongAsPlayed.useMutation({
    onSuccess: () => {
      // キャッシュを無効化して再取得
      utils.bingo.getById.invalidate({ id: id as string });
    },
  });

  const handleTogglePlayed = (songId: string, isPlayed: boolean) => {
    markAsPlayedMutation.mutate({ songId, isPlayed });
  };

  return (
    <div>
      <h2>楽曲リスト</h2>
      {game?.songs.map((song) => (
        <div key={song.id}>
          <input
            type="checkbox"
            checked={song.isPlayed}
            onChange={(e) => handleTogglePlayed(song.id, e.target.checked)}
          />
          {song.title} - {song.artist}
        </div>
      ))}
    </div>
  );
};
```

**`src/server/api/routers/bingo.ts` - markSongAsPlayed API**

```tsx
markSongAsPlayed: protectedProcedure
  .input(
    z.object({
      songId: z.string(),
      isPlayed: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const song = await ctx.db.song.update({
      where: { id: input.songId },
      data: {
        isPlayed: input.isPlayed,
        playedAt: input.isPlayed ? new Date() : null,
      },
    });

    return song;
  }),
```

---

## 参加者フロー

### 1. ゲーム参加

#### フローチャート

```
QRコードをスキャン
  ↓
/game/[id] にアクセス
  ↓
localStorage から sessionToken 取得
  ├─ 存在しない → 新規生成して保存
  └─ 存在する → そのまま使用
  ↓
api.participant.getBySessionToken.useQuery() 実行
  ├─ 既に参加済み
  │   ├─ isGridComplete === false → /game/[id]/setup へリダイレクト
  │   └─ isGridComplete === true → /game/[id]/play へリダイレクト
  └─ 未参加
       ↓
名前入力フォーム表示
  ↓
名前を入力して「参加する」クリック
  ↓
api.participant.join.useMutation() 実行
  ↓
DBにParticipantレコード作成
  ↓
/game/[id]/setup へリダイレクト
```

#### 関連ファイル

| ファイルパス                            | 役割                            |
| --------------------------------------- | ------------------------------- |
| `src/pages/game/[id].tsx`               | 参加ページ                      |
| `src/server/api/routers/participant.ts` | `join`, `getBySessionToken` API |

#### 重要なコード

**`src/pages/game/[id].tsx` - sessionToken生成と参加**

```tsx
const ParticipantGame: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState<string>("");
  const [participantName, setParticipantName] = useState("");

  // sessionToken を localStorage から取得/生成
  useEffect(() => {
    let token = localStorage.getItem("dj-bingo-session");
    if (!token) {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("dj-bingo-session", token);
    }
    setSessionToken(token);
  }, []);

  // 既に参加済みかチェック
  const { data: participant } = api.participant.getBySessionToken.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  // 参加済みなら適切なページへリダイレクト
  useEffect(() => {
    if (participant && participant.bingoGameId === id) {
      if (!participant.isGridComplete) {
        void router.push(`/game/${id}/setup`);
      } else {
        void router.push(`/game/${id}/play`);
      }
    }
  }, [participant, id, router]);

  // 参加処理
  const joinMutation = api.participant.join.useMutation({
    onSuccess: () => {
      // グリッド設定ページへ遷移
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate({
      name: participantName,
      bingoGameId: id as string,
      sessionToken,
    });
  };
};
```

**`src/server/api/routers/participant.ts` - join API**

```tsx
join: publicProcedure  // 認証不要
  .input(
    z.object({
      name: z.string().min(1),
      bingoGameId: z.string(),
      sessionToken: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // ゲームが存在してアクティブか確認
    const bingoGame = await ctx.db.bingoGame.findUnique({
      where: { id: input.bingoGameId },
    });

    if (!bingoGame || !bingoGame.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Bingo game not found or inactive",
      });
    }

    // 既に参加済みか確認
    const existingParticipant = await ctx.db.participant.findUnique({
      where: { sessionToken: input.sessionToken },
    });

    if (existingParticipant) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Already joined this game",
      });
    }

    // 新規参加者作成
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

---

### 2. グリッド設定

#### フローチャート

```
/game/[id]/setup にアクセス
  ↓
api.bingo.getById.useQuery() でゲーム情報取得
  └─ 楽曲リスト取得
  ↓
グリッドサイズに応じた空のグリッド表示
  ├─ 3x3: 9マス
  ├─ 4x4: 16マス
  └─ 5x5: 25マス
  ↓
楽曲リストから選択してグリッドに配置
  ├─ クリックで選択
  └─ グリッドの各マスに楽曲を割り当て
  ↓
すべてのマスが埋まったか確認
  ↓
「ビンゴを開始」ボタンクリック
  ↓
api.participant.setupGrid.useMutation() 実行
  ↓
ParticipantSongレコードを作成
  └─ participantId, songId, position
  ↓
isGridComplete = true に更新
  ↓
/game/[id]/play へリダイレクト
```

#### 関連ファイル

| ファイルパス                            | 役割             |
| --------------------------------------- | ---------------- |
| `src/pages/game/[id]/setup.tsx`         | グリッド設定画面 |
| `src/server/api/routers/participant.ts` | `setupGrid` API  |

#### 重要なコード

**`src/pages/game/[id]/setup.tsx` - グリッド設定**

```tsx
const SetupGrid: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<(string | null)[]>([]);

  const { data: game } = api.bingo.getById.useQuery({ id: id as string });

  // グリッドサイズに応じて初期化
  useEffect(() => {
    if (game) {
      const gridSize = getGridSize(game.size); // 9, 16, 25
      setSelectedSongs(new Array(gridSize).fill(null));
    }
  }, [game]);

  const setupGridMutation = api.participant.setupGrid.useMutation({
    onSuccess: () => {
      void router.push(`/game/${id}/play`);
    },
  });

  const handleSubmit = () => {
    // 選択した楽曲とポジションをマッピング
    const grid = selectedSongs.map((songId, index) => ({
      songId: songId!,
      position: index,
    }));

    setupGridMutation.mutate({ sessionToken, grid });
  };

  return (
    <div>
      <h2>楽曲をグリッドに配置してください</h2>
      {/* グリッド表示 */}
      <div className="grid grid-cols-3">
        {selectedSongs.map((songId, index) => (
          <div key={index}>
            {songId ? (
              <SongCard songId={songId} />
            ) : (
              <EmptySlot onSelect={(id) => handleSelectSong(index, id)} />
            )}
          </div>
        ))}
      </div>
      <button onClick={handleSubmit}>ビンゴを開始</button>
    </div>
  );
};
```

**`src/server/api/routers/participant.ts` - setupGrid API**

```tsx
setupGrid: publicProcedure
  .input(
    z.object({
      sessionToken: z.string(),
      grid: z.array(
        z.object({
          songId: z.string(),
          position: z.number(),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // 参加者を取得
    const participant = await ctx.db.participant.findUnique({
      where: { sessionToken: input.sessionToken },
    });

    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // ParticipantSongレコードを一括作成
    await ctx.db.participantSong.createMany({
      data: input.grid.map((item) => ({
        participantId: participant.id,
        songId: item.songId,
        position: item.position,
      })),
    });

    // isGridComplete を true に更新
    const updatedParticipant = await ctx.db.participant.update({
      where: { id: participant.id },
      data: { isGridComplete: true },
    });

    return updatedParticipant;
  }),
```

---

### 3. ゲームプレイ

#### フローチャート

```
/game/[id]/play にアクセス
  ↓
api.participant.getBySessionToken.useQuery()
  ├─ refetchInterval: 3000 (3秒ごとにポーリング)
  └─ 参加者情報 + グリッド + 楽曲の演奏状態を取得
  ↓
グリッド表示
  ├─ 演奏済み楽曲をハイライト
  └─ 未演奏楽曲は通常表示
  ↓
管理者が楽曲を「演奏済み」にする
  ↓
3秒以内にポーリングで更新
  ↓
画面が自動的に更新される
  ├─ 演奏済み楽曲がハイライトされる
  └─ ビンゴ達成の可能性をチェック
  ↓
ビンゴラインが揃った？
  ├─ YES → api.participant.checkWin.useMutation()
  │          ↓
  │       hasWon = true, wonAt = now()
  │          ↓
  │       「ビンゴ！」画面表示
  └─ NO → 継続
```

#### 関連ファイル

| ファイルパス                            | 役割                                |
| --------------------------------------- | ----------------------------------- |
| `src/pages/game/[id]/play.tsx`          | プレイ画面                          |
| `src/server/api/routers/participant.ts` | `getBySessionToken`, `checkWin` API |

#### 重要なコード

**`src/pages/game/[id]/play.tsx` - リアルタイム更新**

```tsx
const PlayGame: NextPage = () => {
  const [sessionToken, setSessionToken] = useState("");

  // 3秒ごとにポーリング
  const { data: participant } = api.participant.getBySessionToken.useQuery(
    { sessionToken },
    {
      enabled: !!sessionToken,
      refetchInterval: 3000, // 3秒ごと
    }
  );

  const checkWinMutation = api.participant.checkWin.useMutation();

  // ビンゴ判定
  useEffect(() => {
    if (participant && !participant.hasWon) {
      // ビンゴラインが揃ったかチェック
      if (hasWinningLine(participant.participantSongs)) {
        checkWinMutation.mutate({ sessionToken });
      }
    }
  }, [participant]);

  return (
    <div>
      {participant?.hasWon ? (
        <div>🎉 ビンゴ！おめでとうございます！</div>
      ) : (
        <div>
          <h2>ビンゴグリッド</h2>
          <Grid songs={participant?.participantSongs} />
        </div>
      )}
    </div>
  );
};
```

**`src/server/api/routers/participant.ts` - checkWin API**

```tsx
checkWin: publicProcedure
  .input(z.object({ sessionToken: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.participant.findUnique({
      where: { sessionToken: input.sessionToken },
      include: {
        participantSongs: {
          include: { song: true },
        },
        bingoGame: true,
      },
    });

    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // ビンゴ判定ロジック
    const hasWon = checkBingo(participant);

    if (hasWon && !participant.hasWon) {
      // 初めてのビンゴ達成
      const updated = await ctx.db.participant.update({
        where: { id: participant.id },
        data: {
          hasWon: true,
          wonAt: new Date(),
        },
      });
      return updated;
    }

    return participant;
  }),
```

---

## リアルタイム同期フロー

### ポーリングによる同期

```
┌──────────────┐                  ┌──────────────┐
│  管理者画面   │                  │  参加者画面   │
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │ markSongAsPlayed()              │
       │ (楽曲を演奏済みにする)            │
       ▼                                 │
┌──────────────┐                        │
│   Database   │                        │
│  Song.isPlayed                        │
│  = true      │                        │
└──────────────┘                        │
       ▲                                 │
       │                                 │
       │                          3秒ごとにポーリング
       │                                 │
       │                          getBySessionToken()
       │                                 │
       └─────────────────────────────────┘
                                         │
                                    画面更新
                                  (演奏済み表示)
```

### ポーリング間隔の設定

```tsx
// 推奨: 3秒
const { data } = api.participant.getBySessionToken.useQuery(
  { sessionToken },
  { refetchInterval: 3000 }
);

// 高頻度更新が必要な場合: 1秒
{
  refetchInterval: 1000;
}

// サーバー負荷を抑える場合: 5秒
{
  refetchInterval: 5000;
}
```

---

## エラーハンドリング

### 管理者側のエラー

| エラー               | 原因                          | 対処                         |
| -------------------- | ----------------------------- | ---------------------------- |
| `UNAUTHORIZED`       | 未ログイン状態でAPIを呼び出し | `/auth/signin`へリダイレクト |
| `NOT_FOUND`          | 存在しないゲームIDを指定      | エラーメッセージ表示         |
| バリデーションエラー | 楽曲数が不足、など            | フォームエラー表示           |

### 参加者側のエラー

| エラー               | 原因               | 対処                               |
| -------------------- | ------------------ | ---------------------------------- |
| `NOT_FOUND`          | 無効なゲームID     | 「ゲームが見つかりません」表示     |
| `CONFLICT`           | 既に参加済み       | 自動的に適切なページへリダイレクト |
| ゲームが非アクティブ | `isActive = false` | 「ゲームは終了しました」表示       |

### エラーハンドリングの実装例

```tsx
const createMutation = api.bingo.create.useMutation({
  onSuccess: (data) => {
    // 成功時の処理
    void router.push(`/admin/game/${data.id}`);
  },
  onError: (error) => {
    // エラー時の処理
    if (error.data?.code === "UNAUTHORIZED") {
      void router.push("/auth/signin");
    } else {
      alert(`エラー: ${error.message}`);
    }
  },
});
```

---

## まとめ

このドキュメントでは、DJ Bingoアプリケーションの主要なユーザーフローを詳細に説明しました。

### 重要なポイント

1. **管理者フロー**: 認証必須（Magic Link、Google OAuth、Spotify OAuth）、protectedProcedureで保護
2. **参加者フロー**: 認証不要、sessionTokenで識別
3. **リアルタイム更新**: ポーリング（3秒間隔）で実現
4. **エラーハンドリング**: tRPCのエラーコードで適切に処理
5. **ゲームステータス管理**: EDITING → ENTRY → PLAYING → FINISHED のライフサイクル
6. **共同管理機能**: 複数の管理者で1つのゲームを管理可能

### 関連ドキュメント

- [アーキテクチャ](./architecture.md) - システム全体の設計思想
- [コードリーディングガイド](./code-reading-guide.md) - コードの詳細な読み方
- [トラブルシューティング](./troubleshooting/README.md) - よくある問題と解決方法
