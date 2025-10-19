import { type GridCell } from "~/types";

interface SongDetailModalProps {
  isOpen: boolean;
  cell: GridCell | null;
  onClose: () => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  isOpen,
  cell,
  onClose,
}) => {
  if (!isOpen || !cell) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/20"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          title="閉じる"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="pr-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">楽曲情報</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                曲名
              </label>
              <p className="mt-1 text-base break-words text-gray-900">
                {cell.song.title}
              </p>
            </div>

            {cell.song.artist && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  アーティスト
                </label>
                <p className="mt-1 text-base break-words text-gray-900">
                  {cell.song.artist}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">
                演奏状態
              </label>
              <div className="mt-1">
                {cell.isPlayed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    演奏済み
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                    未演奏
                  </span>
                )}
              </div>
            </div>

            {cell.isPlayed && cell.song.playedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  演奏時刻
                </label>
                <p className="mt-1 text-base text-gray-900">
                  {new Date(cell.song.playedAt).toLocaleString("ja-JP")}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
