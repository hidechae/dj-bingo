import { SpotifyIcon } from "~/components/icons/SpotifyIcon";

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
            <SpotifyIcon />
            Spotifyからインポート
          </button>
        )}
      </div>
    )}
  </div>
);
