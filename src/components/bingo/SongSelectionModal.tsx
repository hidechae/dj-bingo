import { type Song } from "~/types";

type SongSelectionModalProps = {
  isOpen: boolean;
  songs: Song[];
  selectedPosition: number | null;
  isSongUsed: (songId: string) => boolean;
  onSongSelect: (songId: string) => void;
  onClose: () => void;
};

export const SongSelectionModal = ({
  isOpen,
  songs,
  selectedPosition,
  isSongUsed,
  onSongSelect,
  onClose,
}: SongSelectionModalProps) => {
  if (!isOpen || selectedPosition === null) {
    return null;
  }

  const handleSongClick = (songId: string) => {
    if (!isSongUsed(songId)) {
      onSongSelect(songId);
      // Don't call onClose() here - let the parent handle modal state
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="bg-opacity-50 fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-4 w-full max-w-2xl rounded-md border bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            マス{selectedPosition + 1}の楽曲を選択
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="モーダルを閉じる"
            title="閉じる"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            利用可能な楽曲から1つを選択してください
          </p>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {songs
            .filter((song) => !isSongUsed(song.id))
            .map((song) => (
              <div
                key={song.id}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
                onClick={() => handleSongClick(song.id)}
              >
                <div className="font-medium text-gray-900">
                  {song.artist ? `${song.artist} - ${song.title}` : song.title}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-sm bg-gray-300 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-400"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
