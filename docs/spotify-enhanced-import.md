# Spotify拡張インポート機能

## 概要

Spotifyからの楽曲インポート機能を拡張し、以下の3つの方法でインポートできるようにしました:

1. **URLからインポート** (既存機能)
   - プレイリストのURLまたはIDを入力してインポート

2. **マイプレイリストから選択** (新機能)
   - Spotifyアカウントと連携して、自分のプレイリスト一覧から選択
   - 無限スクロール対応

3. **検索してインポート** (新機能)
   - トラック、アルバム、プレイリストを検索
   - 検索結果から選択してインポート

## 実装内容

### 1. NextAuth設定

- `src/server/auth.ts`にSpotifyプロバイダーを追加
- 必要なスコープ: `user-read-email`, `playlist-read-private`, `playlist-read-collaborative`, `user-library-read`
- アクセストークンとリフレッシュトークンをセッションに保存
- トークンの自動リフレッシュ機能

### 2. Spotify APIライブラリ拡張

`src/server/lib/spotify.ts`に以下の関数を追加:

- `createUserSpotifyClient(accessToken)`: ユーザー認証済みクライアント作成
- `getUserPlaylists(client, limit, offset)`: ユーザーのプレイリスト一覧取得
- `getUserPlaylistTracks(client, playlistId)`: プレイリストのトラック取得
- `searchSpotify(client, query, types, limit)`: Spotify検索
- `getAlbumTracks(client, albumId)`: アルバムのトラック取得

### 3. tRPCルーター拡張

`src/server/api/routers/spotify.ts`に以下のエンドポイントを追加:

- `getUserPlaylists`: ユーザーのプレイリスト一覧取得（ページネーション対応）
- `getUserPlaylistTracks`: ユーザーのプレイリストからトラック取得
- `search`: Spotify検索（トラック、アルバム、プレイリスト）
- `getAlbumTracks`: アルバムのトラック取得

### 4. UI実装

`src/components/admin/SpotifyImportModal.tsx`を拡張:

- タブ形式のUI（URLから / マイプレイリスト / 検索）
- マイプレイリストの無限スクロール
- 検索結果の表示（トラック、アルバム、プレイリストのタブ切り替え）
- Spotify連携ボタン

## 環境変数

以下の環境変数が必要です:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Spotify App設定

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)でアプリを作成
2. Redirect URIsに以下を追加:
   - `http://localhost:3000/api/auth/callback/spotify` (開発環境)
   - `https://your-domain.com/api/auth/callback/spotify` (本番環境)
3. Client IDとClient Secretを環境変数に設定

## 使用方法

### 1. Spotifyアカウント連携

マイプレイリストや検索機能を使用するには、Spotifyアカウントとの連携が必要です:

1. 「マイプレイリスト」または「検索」タブを選択
2. 「Spotifyと連携」ボタンをクリック
3. Spotifyの認証画面で許可

### 2. マイプレイリストからインポート

1. 「マイプレイリスト」タブを選択
2. プレイリスト一覧からインポートしたいプレイリストをクリック
3. トラック選択画面で曲を選択
4. 「インポート」ボタンをクリック

### 3. 検索してインポート

1. 「検索」タブを選択
2. 検索キーワードを入力して検索
3. 検索結果のタブ（トラック/アルバム/プレイリスト）を切り替え
4. 目的のアイテムを選択
5. トラック選択画面で曲を選択
6. 「インポート」ボタンをクリック

## 技術的な詳細

### 無限スクロール実装

マイプレイリスト一覧は無限スクロールに対応しています:

- 初回20件を取得
- スクロール位置が下部に近づくと自動的に次の20件を取得
- `useCallback`と`useRef`を使用してパフォーマンスを最適化

### トークンリフレッシュ

Spotifyアクセストークンは1時間で期限切れになります:

- JWTコールバックで期限をチェック
- 期限切れの場合、自動的にリフレッシュトークンを使用して新しいアクセストークンを取得
- エラー時はセッションにエラーフラグを設定

### エラーハンドリング

- Spotify APIエラーは適切なエラーメッセージとしてユーザーに表示
- 認証エラーの場合は再連携を促すメッセージを表示
- ネットワークエラーやタイムアウトにも対応

## 今後の改善案

- [ ] プレイリストのプレビュー機能
- [ ] お気に入りトラックからのインポート
- [ ] 最近再生した曲からのインポート
- [ ] トラックのプレビュー再生機能
- [ ] 検索結果のページネーション
- [ ] 検索フィルター（年代、ジャンルなど）
