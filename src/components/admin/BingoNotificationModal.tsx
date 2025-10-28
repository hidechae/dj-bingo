import { Modal } from "~/components/ui/Modal";

interface BingoNotificationModalProps {
  isOpen: boolean;
  winnerNames: string[];
  onClose: () => void;
}

export const BingoNotificationModal: React.FC<BingoNotificationModalProps> = ({
  isOpen,
  winnerNames,
  onClose,
}) => {
  if (winnerNames.length === 0) return null;

  return (
    <Modal isOpen={isOpen} size="md" className="p-5">
      <div className="mt-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">🎉 ビンゴ達成！</h3>
        </div>

        <div className="mt-4">
          {winnerNames.length === 1 ? (
            <p className="text-center text-base text-gray-700">
              <span className="font-bold text-yellow-600">
                {winnerNames[0]}
              </span>
              さんがビンゴになりました！
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-700">
                {winnerNames.length}名がビンゴになりました！
              </p>
              <ul className="space-y-1">
                {winnerNames.map((name, index) => (
                  <li
                    key={index}
                    className="text-sm font-medium text-yellow-600"
                  >
                    • {name}さん
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </Modal>
  );
};
