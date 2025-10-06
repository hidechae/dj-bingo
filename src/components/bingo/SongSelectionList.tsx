type SongSelectionListProps = {
  songs: any[];
  selectedPosition: number | null;
  isSongUsed: (songId: string) => boolean;
  onSongAssign: (songId: string) => void;
};

export const SongSelectionList = ({
  songs,
  selectedPosition,
  isSongUsed,
  onSongAssign,
}: SongSelectionListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">楽曲一覧</h3>
      {selectedPosition !== null ? (
        <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
          マス{selectedPosition + 1}に設定する楽曲を選択してください
        </p>
      ) : (
        <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
          先にビンゴグリッドでマスを選択してください
        </p>
      )}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {songs.map((song: any) => {
          const isUsed = isSongUsed(song.id);
          const isDisabled = isUsed || selectedPosition === null;

          return (
            <div
              key={song.id}
              className={`p-3 border rounded-lg transition-colors ${
                isUsed
                  ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                  : selectedPosition === null
                    ? "bg-white border-gray-200 cursor-not-allowed opacity-60"
                    : "bg-white border-gray-200 hover:bg-green-50 hover:border-green-300 cursor-pointer"
              }`}
              onClick={() => !isDisabled && onSongAssign(song.id)}
            >
              <div className="font-medium text-gray-900">
                {song.artist ? `${song.artist} - ${song.title}` : song.title}
              </div>
              {isUsed && (
                <div className="text-xs text-gray-400 mt-1">選択済み</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
