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
        <p className="rounded-sm bg-green-50 p-2 text-sm text-green-600">
          マス{selectedPosition + 1}に設定する楽曲を選択してください
        </p>
      ) : (
        <p className="rounded-sm bg-gray-50 p-2 text-sm text-gray-500">
          先にビンゴグリッドでマスを選択してください
        </p>
      )}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {songs.map((song: any) => {
          const isUsed = isSongUsed(song.id);
          const isDisabled = isUsed || selectedPosition === null;

          return (
            <div
              key={song.id}
              className={`rounded-lg border p-3 transition-colors ${
                isUsed
                  ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500"
                  : selectedPosition === null
                    ? "cursor-not-allowed border-gray-200 bg-white opacity-60"
                    : "cursor-pointer border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
              }`}
              onClick={() => !isDisabled && onSongAssign(song.id)}
            >
              <div className="font-medium text-gray-900">
                {song.artist ? `${song.artist} - ${song.title}` : song.title}
              </div>
              {isUsed && (
                <div className="mt-1 text-xs text-gray-400">選択済み</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
