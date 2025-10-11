import { GameStatus, type BingoGame, type Song } from "~/types";
import { type EditingSong } from "~/hooks/useSongEditor";

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
  isSaving,
  isMarkingPlayed,
}: SongListProps) => {
  const currentStatus = bingoGame.status as GameStatus;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">楽曲リスト</h3>
        {currentStatus === GameStatus.EDITING && (
          <div className="flex gap-2">
            <button
              onClick={onSongEdit}
              disabled={isSaving}
              className="rounded-sm bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {songEditingMode ? "保存" : "編集"}
            </button>
            {songEditingMode && (
              <button
                onClick={onCancelEdit}
                className="rounded-sm bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
              >
                キャンセル
              </button>
            )}
          </div>
        )}
      </div>

      {songEditingMode ? (
        <SongEditMode
          editingSongs={editingSongs}
          onUpdateSong={onUpdateSong}
          onRemoveSong={onRemoveSong}
          onAddSong={onAddSong}
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

const SongEditMode = ({
  editingSongs,
  onUpdateSong,
  onRemoveSong,
  onAddSong,
}: {
  editingSongs: EditingSong[];
  onUpdateSong: (
    index: number,
    field: "title" | "artist",
    value: string
  ) => void;
  onRemoveSong: (index: number) => void;
  onAddSong: () => void;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      {editingSongs.map((song, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
        >
          <input
            type="text"
            value={song.title}
            onChange={(e) => onUpdateSong(index, "title", e.target.value)}
            placeholder="曲名"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            value={song.artist}
            onChange={(e) => onUpdateSong(index, "artist", e.target.value)}
            placeholder="アーティスト名"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={() => onRemoveSong(index)}
            className="px-2 text-red-600 hover:text-red-800"
          >
            削除
          </button>
        </div>
      ))}
    </div>
    <div className="flex justify-center">
      <button
        onClick={onAddSong}
        className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        曲を追加
      </button>
    </div>
  </div>
);

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
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {song.artist} - {song.title}
                </p>
              </div>
              {currentStatus === GameStatus.PLAYING && (
                <button
                  onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                  disabled={isMarkingPlayed}
                  className="rounded-sm bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
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
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {song.artist} - {song.title}
                </p>
                {song.playedAt && (
                  <p className="text-xs text-gray-600">
                    演奏時間: {new Date(song.playedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {currentStatus === GameStatus.PLAYING && (
                <button
                  onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                  disabled={isMarkingPlayed}
                  className="rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
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
