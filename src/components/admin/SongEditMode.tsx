type SongEditModeProps = {
  songs: Array<{ title: string; artist: string }>;
  onUpdateSong: (
    index: number,
    field: "title" | "artist",
    value: string
  ) => void;
  onRemoveSong: (index: number) => void;
  onAddSong: () => void;
  onSpotifyImport?: () => void;
  showAddButton?: boolean;
  allowRemoveAll?: boolean;
};

export const SongEditMode = ({
  songs,
  onUpdateSong,
  onRemoveSong,
  onAddSong,
  onSpotifyImport,
  showAddButton = true,
  allowRemoveAll = true,
}: SongEditModeProps) => (
  <div className="space-y-4">
    <div className="space-y-3">
      {songs.map((song, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
        >
          <input
            type="text"
            value={song.title}
            onChange={(e) => onUpdateSong(index, "title", e.target.value)}
            placeholder="曲名"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            value={song.artist}
            onChange={(e) => onUpdateSong(index, "artist", e.target.value)}
            placeholder="アーティスト名"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
          />
          {(allowRemoveAll || songs.length > 1) && (
            <button
              type="button"
              onClick={() => onRemoveSong(index)}
              className="cursor-pointer self-end px-2 text-red-600 hover:text-red-800 sm:self-auto"
            >
              削除
            </button>
          )}
        </div>
      ))}
    </div>
    {showAddButton && (
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onAddSong}
          className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          曲を追加
        </button>
        {onSpotifyImport && (
          <button
            type="button"
            onClick={onSpotifyImport}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Spotifyからインポート
          </button>
        )}
      </div>
    )}
  </div>
);
