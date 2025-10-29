import { GameStatus, type BingoGame, type Song } from "~/types";
import { SongInfo } from "~/components/common/SongInfo";
import { SpotifyIcon } from "~/components/common/SpotifyIcon";

type SongListProps = {
  bingoGame: BingoGame;
  onAddSong: () => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onDeleteAllSongs?: () => void;
  onToggleSongPlayed: (songId: string, isPlayed: boolean) => void;
  onSpotifyImport?: () => void;
  isMarkingPlayed: boolean;
  isDeletingSong?: boolean;
};

export const SongList = ({
  bingoGame,
  onAddSong,
  onEditSong,
  onDeleteSong,
  onDeleteAllSongs,
  onToggleSongPlayed,
  onSpotifyImport,
  isMarkingPlayed,
  isDeletingSong = false,
}: SongListProps) => {
  const currentStatus = bingoGame.status as GameStatus;

  // Check for duplicate songs (same title and artist)
  const findDuplicates = () => {
    const seen = new Map<string, Song[]>();
    bingoGame.songs.forEach((song) => {
      const key = `${song.title.toLowerCase()}:${(song.artist || "").toLowerCase()}`;
      const existing = seen.get(key) || [];
      existing.push(song);
      seen.set(key, existing);
    });

    return Array.from(seen.values()).filter((songs) => songs.length > 1);
  };

  const duplicates = findDuplicates();

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          楽曲リスト ({bingoGame.songs.length}曲)
        </h3>
        {currentStatus === GameStatus.EDITING && (
          <div className="flex gap-2">
            {onDeleteAllSongs && bingoGame.songs.length > 0 && (
              <button
                onClick={onDeleteAllSongs}
                className="cursor-pointer rounded-sm border border-red-600 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                全削除
              </button>
            )}
            <button
              onClick={onAddSong}
              className="cursor-pointer rounded-sm bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              曲を追加
            </button>
            {onSpotifyImport && (
              <button
                onClick={onSpotifyImport}
                className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
              >
                <SpotifyIcon className="h-4 w-4" />
                Spotify
              </button>
            )}
          </div>
        )}
      </div>

      {duplicates.length > 0 && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                重複する楽曲があります
              </h4>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  以下の楽曲が重複しています。同じタイトルとアーティストの組み合わせは推奨されません。
                </p>
                <ul className="list-inside list-disc space-y-1">
                  {duplicates.map((songs, index) => {
                    const firstSong = songs[0];
                    if (!firstSong) return null;
                    return (
                      <li key={index}>
                        {firstSong.title}
                        {firstSong.artist && ` - ${firstSong.artist}`} (
                        {songs.length}件)
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {bingoGame.songs.length > 0 ? (
        <SongDisplayMode
          songs={bingoGame.songs}
          currentStatus={currentStatus}
          onEditSong={onEditSong}
          onDeleteSong={onDeleteSong}
          onToggleSongPlayed={onToggleSongPlayed}
          isMarkingPlayed={isMarkingPlayed}
          isDeletingSong={isDeletingSong}
        />
      ) : (
        <EmptyState currentStatus={currentStatus} />
      )}
    </div>
  );
};

const SongDisplayMode = ({
  songs,
  currentStatus,
  onEditSong,
  onDeleteSong,
  onToggleSongPlayed,
  isMarkingPlayed,
  isDeletingSong,
}: {
  songs: Song[];
  currentStatus: GameStatus;
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onToggleSongPlayed: (songId: string, isPlayed: boolean) => void;
  isMarkingPlayed: boolean;
  isDeletingSong: boolean;
}) => {
  // Sort songs by artist name (ascending), then by title (ascending)
  const sortSongs = (songList: Song[]) => {
    return [...songList].sort((a, b) => {
      const artistA = (a.artist || "").toLowerCase();
      const artistB = (b.artist || "").toLowerCase();

      // Compare by artist first
      if (artistA !== artistB) {
        return artistA.localeCompare(artistB, "ja");
      }

      // If artists are the same, compare by title
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase(), "ja");
    });
  };

  // 編集中は区分なしで表示
  if (currentStatus === GameStatus.EDITING) {
    const sortedSongs = sortSongs(songs);
    return (
      <div className="space-y-2">
        {sortedSongs.map((song) => (
          <div
            key={song.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <SongInfo
              title={song.title}
              artist={song.artist}
              className="flex-1"
            />
            <div className="ml-3 flex flex-shrink-0 gap-2">
              <button
                onClick={() => onEditSong(song)}
                className="cursor-pointer rounded-sm bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                編集
              </button>
              <button
                onClick={() => onDeleteSong(song.id)}
                disabled={isDeletingSong}
                className="cursor-pointer rounded-sm bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // エントリー開始以降は未演奏/演奏済みで区分表示
  const unplayedSongs = sortSongs(songs.filter((s) => !s.isPlayed));
  const playedSongs = sortSongs(songs.filter((s) => s.isPlayed));

  return (
    <div>
      {/* Unplayed Songs Section */}
      <div className="mb-6">
        <h4 className="text-md mb-3 font-medium text-gray-700">
          未演奏 ({unplayedSongs.length}曲)
        </h4>
        <div className="space-y-2">
          {unplayedSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <SongInfo
                title={song.title}
                artist={song.artist}
                className="flex-1"
              />
              <div className="ml-3 flex flex-shrink-0 gap-2">
                {currentStatus === GameStatus.PLAYING && (
                  <button
                    onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                    disabled={isMarkingPlayed}
                    className="cursor-pointer rounded-sm bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    演奏済みにする
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {unplayedSongs.length === 0 && (
          <p className="py-4 text-center text-gray-500">
            すべての楽曲が演奏済みです
          </p>
        )}
      </div>

      {/* Played Songs Section */}
      <div>
        <h4 className="text-md mb-3 font-medium text-gray-700">
          演奏済み ({playedSongs.length}曲)
        </h4>
        <div className="space-y-2">
          {playedSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <SongInfo title={song.title} artist={song.artist} />
                {song.playedAt && (
                  <p className="mt-1 text-xs text-gray-600">
                    演奏時間: {new Date(song.playedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {currentStatus === GameStatus.PLAYING && (
                <button
                  onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                  disabled={isMarkingPlayed}
                  className="ml-3 flex-shrink-0 cursor-pointer rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  未演奏に戻す
                </button>
              )}
            </div>
          ))}
        </div>
        {playedSongs.length === 0 && (
          <p className="py-4 text-center text-gray-500">
            まだ演奏された楽曲はありません
          </p>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ currentStatus }: { currentStatus: GameStatus }) => (
  <div className="py-8 text-center text-gray-500">
    <p>まだ楽曲が登録されていません</p>
    {currentStatus === GameStatus.EDITING && (
      <p className="text-sm">「曲を追加」ボタンから楽曲を追加してください</p>
    )}
  </div>
);
