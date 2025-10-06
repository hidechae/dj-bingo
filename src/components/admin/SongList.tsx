import { GameStatus } from "~/types";
import { type EditingSong } from "~/hooks/useSongEditor";

type SongListProps = {
  bingoGame: any;
  songEditingMode: boolean;
  editingSongs: EditingSong[];
  onSongEdit: () => void;
  onAddSong: () => void;
  onUpdateSong: (index: number, field: "title" | "artist", value: string) => void;
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">楽曲リスト</h3>
        {currentStatus === GameStatus.EDITING && (
          <div className="flex gap-2">
            {songEditingMode && (
              <button
                onClick={onAddSong}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                曲を追加
              </button>
            )}
            <button
              onClick={onSongEdit}
              disabled={isSaving}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {songEditingMode ? "保存" : "編集"}
            </button>
            {songEditingMode && (
              <button
                onClick={onCancelEdit}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
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
}: {
  editingSongs: EditingSong[];
  onUpdateSong: (index: number, field: "title" | "artist", value: string) => void;
  onRemoveSong: (index: number) => void;
}) => (
  <div className="space-y-2 max-h-96 overflow-y-auto">
    {editingSongs.map((song, index) => (
      <div
        key={index}
        className="flex gap-4 items-center p-3 border border-gray-200 rounded-lg"
      >
        <input
          type="text"
          value={song.title}
          onChange={(e) => onUpdateSong(index, "title", e.target.value)}
          placeholder="曲名"
          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
        />
        <input
          type="text"
          value={song.artist}
          onChange={(e) => onUpdateSong(index, "artist", e.target.value)}
          placeholder="アーティスト名"
          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
        />
        <button
          onClick={() => onRemoveSong(index)}
          className="text-red-600 hover:text-red-800 px-2"
        >
          削除
        </button>
      </div>
    ))}
  </div>
);

const SongDisplayMode = ({
  songs,
  currentStatus,
  onToggleSongPlayed,
  isMarkingPlayed,
}: {
  songs: any[];
  currentStatus: GameStatus;
  onToggleSongPlayed: (songId: string, isPlayed: boolean) => void;
  isMarkingPlayed: boolean;
}) => {
  const unplayedSongs = songs.filter((s: any) => !s.isPlayed);
  const playedSongs = songs.filter((s: any) => s.isPlayed);

  return (
    <div>
      {/* Unplayed Songs Section */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          未演奏 ({unplayedSongs.length}曲)
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {unplayedSongs.map((song: any) => (
            <div
              key={song.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200"
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
                  className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  演奏済みにする
                </button>
              )}
            </div>
          ))}
        </div>
        {unplayedSongs.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            すべての楽曲が演奏済みです
          </p>
        )}
      </div>

      {/* Played Songs Section */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">
          演奏済み ({playedSongs.length}曲)
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {playedSongs.map((song: any) => (
            <div
              key={song.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {song.artist} - {song.title}
                </p>
                <p className="text-xs text-gray-600">
                  演奏時間: {new Date(song.playedAt).toLocaleString()}
                </p>
              </div>
              {currentStatus === GameStatus.PLAYING && (
                <button
                  onClick={() => onToggleSongPlayed(song.id, song.isPlayed)}
                  disabled={isMarkingPlayed}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  未演奏に戻す
                </button>
              )}
            </div>
          ))}
        </div>
        {playedSongs.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            まだ演奏された楽曲はありません
          </p>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ currentStatus }: { currentStatus: GameStatus }) => (
  <div className="text-center py-8 text-gray-500">
    <p>まだ楽曲が登録されていません</p>
    {currentStatus === GameStatus.EDITING && (
      <p className="text-sm">「編集」ボタンから楽曲を追加してください</p>
    )}
  </div>
);
