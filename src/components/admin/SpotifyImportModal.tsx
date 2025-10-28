import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { api } from "~/utils/api";
import { SpotifyIcon } from "~/components/common/SpotifyIcon";
import { Modal } from "~/components/ui/Modal";

interface SpotifyImportModalProps {
  isOpen: boolean;
  onImport: (tracks: Array<{ title: string; artist: string }>) => void;
  onClose: () => void;
}

type Track = {
  title: string;
  artist: string;
  album?: string;
};

type TabType = "url" | "playlists" | "search";

type Playlist = {
  id: string;
  name: string;
  description?: string | null;
  trackCount: number;
  imageUrl?: string;
  owner: string;
};

type Album = {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  trackCount: number;
};

type SearchPlaylist = {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  imageUrl?: string;
  owner: string;
};

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  isOpen,
  onImport,
  onClose,
}) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("url");
  const [step, setStep] = useState<"input" | "select">("input");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [error, setError] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  // マイプレイリスト用の状態
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsOffset, setPlaylistsOffset] = useState(0);
  const [hasMorePlaylists, setHasMorePlaylists] = useState(true);
  const playlistsScrollRef = useRef<HTMLDivElement>(null);

  // 検索用の状態
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    tracks?: Track[];
    albums?: Album[];
    playlists?: SearchPlaylist[];
  }>({});
  const [searchTab, setSearchTab] = useState<"tracks" | "albums" | "playlists">(
    "tracks"
  );
  const [hasSearched, setHasSearched] = useState(false);

  const hasSpotifyAuth = !!session?.accessToken;

  // API呼び出し
  const getPlaylistTracksMutation = api.spotify.getPlaylistTracks.useMutation({
    onSuccess: (data) => {
      setTracks(data.tracks);
      setError("");
      setSelectedIndices(new Set(data.tracks.map((_, i) => i)));
      setStep("select");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const getUserPlaylistsQuery = api.spotify.getUserPlaylists.useQuery(
    { limit: 20, offset: playlistsOffset },
    {
      enabled: isOpen && activeTab === "playlists" && hasSpotifyAuth,
      refetchOnMount: true,
      staleTime: 0,
    }
  );

  const getUserPlaylistTracksMutation =
    api.spotify.getUserPlaylistTracks.useMutation({
      onSuccess: (data) => {
        setTracks(data.tracks);
        setError("");
        setSelectedIndices(new Set(data.tracks.map((_, i) => i)));
        setStep("select");
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  const searchMutation = api.spotify.search.useQuery(
    { query: searchQuery, types: ["track", "album", "playlist"], limit: 20 },
    { enabled: false }
  );

  const getAlbumTracksMutation = api.spotify.getAlbumTracks.useMutation({
    onSuccess: (data) => {
      setTracks(data.tracks);
      setError("");
      setSelectedIndices(new Set(data.tracks.map((_, i) => i)));
      setStep("select");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // マイプレイリストのデータ読み込み
  useEffect(() => {
    console.log("🔄 Playlists useEffect triggered", {
      hasData: !!getUserPlaylistsQuery.data,
      dataLength: getUserPlaylistsQuery.data?.items.length,
      offset: playlistsOffset,
      currentPlaylistsLength: playlists.length,
      isOpen,
      activeTab,
    });

    if (getUserPlaylistsQuery.data) {
      const items = getUserPlaylistsQuery.data.items.map((item) => ({
        ...item,
        owner: item.owner ?? "Unknown",
      }));

      console.log("✅ Setting playlists", {
        itemsCount: items.length,
        offset: playlistsOffset,
      });

      if (playlistsOffset === 0) {
        setPlaylists(items);
      } else {
        setPlaylists((prev) => [...prev, ...items]);
      }
      setHasMorePlaylists(getUserPlaylistsQuery.data.hasMore);
    }
  }, [
    getUserPlaylistsQuery.data,
    playlistsOffset,
    playlists.length,
    isOpen,
    activeTab,
  ]);

  // 無限スクロール処理
  const handlePlaylistsScroll = useCallback(() => {
    const element = playlistsScrollRef.current;
    if (!element || !hasMorePlaylists || getUserPlaylistsQuery.isFetching)
      return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setPlaylistsOffset((prev) => prev + 20);
    }
  }, [hasMorePlaylists, getUserPlaylistsQuery.isFetching]);

  // モーダルが閉じられたら状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("url");
      setStep("input");
      setPlaylistUrl("");
      setError("");
      setTracks([]);
      setSelectedIndices(new Set());
      setPlaylists([]);
      setPlaylistsOffset(0);
      setHasMorePlaylists(true);
      setSearchQuery("");
      setSearchResults({});
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleFetchTracks = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!playlistUrl.trim()) {
      setError("プレイリストURLまたはIDを入力してください");
      return;
    }

    getPlaylistTracksMutation.mutate({ playlistUrl: playlistUrl.trim() });
  };

  const handleToggleTrack = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === tracks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(tracks.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const selectedTracks = tracks.filter((_, i) => selectedIndices.has(i));
    onImport(selectedTracks);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBack = () => {
    setStep("input");
    setError("");
  };

  const handleSpotifyConnect = () => {
    void signIn("spotify");
  };

  const handlePlaylistSelect = (playlistId: string) => {
    getUserPlaylistTracksMutation.mutate({ playlistId });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("検索キーワードを入力してください");
      return;
    }
    setError("");
    setHasSearched(false);
    const result = await searchMutation.refetch();
    setHasSearched(true);
    if (result.data) {
      setSearchResults(result.data);
    } else if (result.error) {
      setError(result.error.message);
    } else {
      // データがない場合は空の結果を設定
      setSearchResults({
        tracks: [],
        albums: [],
        playlists: [],
      });
    }
  };

  const handleSearchTrackSelect = (selectedTracks: Track[]) => {
    setTracks(selectedTracks);
    setSelectedIndices(new Set(selectedTracks.map((_, i) => i)));
    setStep("select");
  };

  const handleAlbumSelect = (albumId: string) => {
    getAlbumTracksMutation.mutate({ albumId });
  };

  const handleSearchPlaylistSelect = (playlistId: string) => {
    getUserPlaylistTracksMutation.mutate({ playlistId });
  };

  // トラック選択画面
  if (step === "select") {
    return (
      <Modal isOpen={isOpen} size="xl" className="max-w-2xl p-5">
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <SpotifyIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">楽曲を選択</h3>
          </div>

          <div className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {tracks.length}曲中 {selectedIndices.size}曲を選択
              </p>
              <button
                type="button"
                onClick={handleToggleAll}
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedIndices.size === tracks.length
                  ? "すべて解除"
                  : "すべて選択"}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-4 max-h-96 overflow-y-auto rounded-md border border-gray-200">
              {tracks.map((track, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndices.has(index)}
                    onChange={() => handleToggleTrack(index)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {track.artist}
                      {track.album && ` • ${track.album}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                戻る
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedIndices.size === 0}
                  className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedIndices.size}曲をインポート
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // メイン画面（タブ形式）
  return (
    <Modal isOpen={isOpen} size="xl" className="max-w-3xl p-5">
      <div className="mt-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <SpotifyIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Spotifyからインポート
          </h3>
        </div>

        {/* タブナビゲーション */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("url")}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "url"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              URLから
            </button>
            <button
              onClick={() => setActiveTab("playlists")}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "playlists"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              マイプレイリスト
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                activeTab === "search"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              検索
            </button>
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="mt-4">
          {/* URLタブ */}
          {activeTab === "url" && (
            <form onSubmit={handleFetchTracks}>
              <div className="mb-4">
                <label
                  htmlFor="playlistUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  プレイリストURLまたはID
                </label>
                <input
                  type="text"
                  id="playlistUrl"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://open.spotify.com/playlist/..."
                  autoFocus
                  disabled={getPlaylistTracksMutation.isPending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Spotifyプレイリストのリンク、またはプレイリストIDを入力してください
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={getPlaylistTracksMutation.isPending}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={
                    !playlistUrl.trim() || getPlaylistTracksMutation.isPending
                  }
                  className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {getPlaylistTracksMutation.isPending
                    ? "取得中..."
                    : "楽曲を取得"}
                </button>
              </div>
            </form>
          )}

          {/* マイプレイリストタブ */}
          {activeTab === "playlists" && (
            <div>
              {!hasSpotifyAuth ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-gray-600">
                    Spotifyアカウントと連携してプレイリストを表示
                  </p>
                  <button
                    onClick={handleSpotifyConnect}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <SpotifyIcon className="h-5 w-5" />
                    Spotifyと連携
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div
                    ref={playlistsScrollRef}
                    onScroll={handlePlaylistsScroll}
                    className="max-h-96 overflow-y-auto"
                  >
                    {getUserPlaylistsQuery.isLoading &&
                    playlists.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        読み込み中...
                      </div>
                    ) : playlists.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        プレイリストが見つかりませんでした
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {playlists.map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => handlePlaylistSelect(playlist.id)}
                            disabled={getUserPlaylistTracksMutation.isPending}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {playlist.imageUrl ? (
                              <img
                                src={playlist.imageUrl}
                                alt={playlist.name}
                                className="h-12 w-12 flex-shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                                <SpotifyIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {playlist.name}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {playlist.owner} • {playlist.trackCount}曲
                              </p>
                            </div>
                          </button>
                        ))}
                        {getUserPlaylistsQuery.isFetching && (
                          <div className="py-4 text-center text-sm text-gray-500">
                            読み込み中...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 検索タブ */}
          {activeTab === "search" && (
            <div>
              {!hasSpotifyAuth ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-gray-600">
                    Spotifyアカウントと連携して検索機能を使用
                  </p>
                  <button
                    onClick={handleSpotifyConnect}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <SpotifyIcon className="h-5 w-5" />
                    Spotifyと連携
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleSearch();
                          }
                        }}
                        className="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="曲名、アーティスト、アルバム、プレイリストを検索..."
                        autoFocus
                      />
                      <button
                        onClick={() => void handleSearch()}
                        disabled={searchMutation.isFetching}
                        className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {searchMutation.isFetching ? "検索中..." : "検索"}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* 検索前のメッセージ */}
                  {!hasSearched && !searchMutation.isFetching && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      キーワードを入力して検索してください
                    </div>
                  )}

                  {/* 検索結果のタブ */}
                  {hasSearched && (
                    <>
                      {/* 全体で結果が0件の場合 */}
                      {(searchResults.tracks?.length ?? 0) === 0 &&
                      (searchResults.albums?.length ?? 0) === 0 &&
                      (searchResults.playlists?.length ?? 0) === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-sm text-gray-500">
                            「{searchQuery}」の検索結果が見つかりませんでした
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            別のキーワードで検索してみてください
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 border-b border-gray-200">
                            <nav className="-mb-px flex space-x-6">
                              <button
                                onClick={() => setSearchTab("tracks")}
                                className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                                  searchTab === "tracks"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                              >
                                トラック ({searchResults.tracks?.length ?? 0})
                              </button>
                              <button
                                onClick={() => setSearchTab("albums")}
                                className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                                  searchTab === "albums"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                              >
                                アルバム ({searchResults.albums?.length ?? 0})
                              </button>
                              <button
                                onClick={() => setSearchTab("playlists")}
                                className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                                  searchTab === "playlists"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                              >
                                プレイリスト (
                                {searchResults.playlists?.length ?? 0})
                              </button>
                            </nav>
                          </div>

                          <div className="max-h-80 overflow-y-auto">
                            {/* トラック検索結果 */}
                            {searchTab === "tracks" && searchResults.tracks && (
                              <div className="space-y-2">
                                {searchResults.tracks.length === 0 ? (
                                  <p className="py-8 text-center text-sm text-gray-500">
                                    トラックが見つかりませんでした
                                  </p>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleSearchTrackSelect(
                                          searchResults.tracks!
                                        )
                                      }
                                      className="w-full cursor-pointer rounded-lg border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                                    >
                                      すべてのトラックを選択 (
                                      {searchResults.tracks.length}曲)
                                    </button>
                                    {searchResults.tracks.map(
                                      (track, index) => (
                                        <div
                                          key={index}
                                          className="rounded-lg border border-gray-200 p-3"
                                        >
                                          <p className="text-sm font-medium text-gray-900">
                                            {track.title}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {track.artist}
                                            {track.album && ` • ${track.album}`}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {/* アルバム検索結果 */}
                            {searchTab === "albums" && searchResults.albums && (
                              <div className="space-y-2">
                                {searchResults.albums.length === 0 ? (
                                  <p className="py-8 text-center text-sm text-gray-500">
                                    アルバムが見つかりませんでした
                                  </p>
                                ) : (
                                  searchResults.albums.map((album) => (
                                    <button
                                      key={album.id}
                                      onClick={() =>
                                        handleAlbumSelect(album.id)
                                      }
                                      disabled={
                                        getAlbumTracksMutation.isPending
                                      }
                                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {album.imageUrl ? (
                                        <img
                                          src={album.imageUrl}
                                          alt={album.name}
                                          className="h-12 w-12 flex-shrink-0 rounded object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                                          <SpotifyIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                          {album.name}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                          {album.artist} • {album.trackCount}曲
                                        </p>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}

                            {/* プレイリスト検索結果 */}
                            {searchTab === "playlists" &&
                              searchResults.playlists && (
                                <div className="space-y-2">
                                  {searchResults.playlists.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                      プレイリストが見つかりませんでした
                                    </p>
                                  ) : (
                                    searchResults.playlists.map((playlist) => (
                                      <button
                                        key={playlist.id}
                                        onClick={() =>
                                          handleSearchPlaylistSelect(
                                            playlist.id
                                          )
                                        }
                                        disabled={
                                          getUserPlaylistTracksMutation.isPending
                                        }
                                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {playlist.imageUrl ? (
                                          <img
                                            src={playlist.imageUrl}
                                            alt={playlist.name}
                                            className="h-12 w-12 flex-shrink-0 rounded object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                                            <SpotifyIcon className="h-6 w-6 text-gray-400" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-medium text-gray-900">
                                            {playlist.name}
                                          </p>
                                          <p className="truncate text-xs text-gray-500">
                                            {playlist.owner} •{" "}
                                            {playlist.trackCount}曲
                                          </p>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
