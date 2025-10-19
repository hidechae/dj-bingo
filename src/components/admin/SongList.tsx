import { GameStatus, type BingoGame, type Song } from "~/types";
import { type EditingSong } from "~/hooks/useSongEditor";
import { SongEditMode } from "./SongEditMode";
import { SongInfo } from "~/components/common/SongInfo";

type SongListProps = {
  bingoGame: BingoGame;
  songEditingMode: boolean;
  editingSongs: EditingSong[];
  onSongEdit: () => void;
  onAddSong: () => void;
  onUpdateSong: (
    index: number,
    field: "title" | "artist",
    value: string
  ) => void;
  onRemoveSong: (index: number) => void;
  onCancelEdit: () => void;
  onToggleSongPlayed: (songId: string, isPlayed: boolean) => void;
  onSpotifyImport?: () => void;
  isSaving: boolean;
  isMarkingPlayed: boolean;
};

export const SongList = ({
  bingoGame,
  songEditingMode,
  editingSongs,
  onSongEdit,
  onAddSong,
  onUpdateSong,
  onRemoveSong,
  onCancelEdit,
  onToggleSongPlayed,
  onSpotifyImport,
  isSaving,
  isMarkingPlayed,
}: SongListProps) => {
  const currentStatus = bingoGame.status as GameStatus;

  const songCount = songEditingMode
    ? editingSongs.length
    : bingoGame.songs.length;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          楽曲リスト ({songCount}曲)
        </h3>
        {currentStatus === GameStatus.EDITING && (
          <div className="flex gap-2">
            <button
              onClick={onSongEdit}
              disabled={isSaving}
              className="cursor-pointer rounded-sm bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {songEditingMode ? "保存" : "編集"}
            </button>
            {songEditingMode && (
              <button
                onClick={onCancelEdit}
                className="cursor-pointer rounded-sm bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>
        )}
      </div>

      {songEditingMode ? (
        <SongEditMode
          songs={editingSongs}
          onUpdateSong={onUpdateSong}
          onRemoveSong={onRemoveSong}
          onAddSong={onAddSong}
          onSpotifyImport={onSpotifyImport}
        />
      ) : bingoGame.songs.length > 0 ? (
        <SongDisplayMode
          songs={bingoGame.songs}
          currentStatus={currentStatus}
          onToggleSongPlayed={onToggleSongPlayed}
          isMarkingPlayed={isMarkingPlayed}
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
  onToggleSongPlayed,
  isMarkingPlayed,
}: {
  songs: Song[];
  currentStatus: GameStatus;
  onToggleSongPlayed: (songId: string, isPlayed: boolean) => void;
  isMarkingPlayed: boolean;
}) => {
  const unplayedSongs = songs.filter((s) => !s.isPlayed);
  const playedSongs = songs.filter((s) => s.isPlayed);

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
              {currentStatus === GameStatus.PLAYING && (
                <button
                  onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                  disabled={isMarkingPlayed}
                  className="ml-3 flex-shrink-0 cursor-pointer rounded-sm bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  演奏済みにする
                </button>
              )}
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
      <p className="text-sm">「編集」ボタンから楽曲を追加してください</p>
    )}
  </div>
);
