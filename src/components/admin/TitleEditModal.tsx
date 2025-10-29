import { useState, useEffect } from "react";
import { Modal } from "~/components/ui/Modal";
import { GameStatus, BingoSize } from "~/types";

// BingoSizeとnumberの変換ヘルパー
const bingoSizeToNumber = (size: BingoSize): number => {
  switch (size) {
    case BingoSize.THREE_BY_THREE:
      return 3;
    case BingoSize.FOUR_BY_FOUR:
      return 4;
    case BingoSize.FIVE_BY_FIVE:
      return 5;
  }
};

const numberToBingoSize = (num: number): BingoSize => {
  switch (num) {
    case 3:
      return BingoSize.THREE_BY_THREE;
    case 4:
      return BingoSize.FOUR_BY_FOUR;
    case 5:
      return BingoSize.FIVE_BY_FIVE;
    default:
      return BingoSize.FIVE_BY_FIVE;
  }
};

interface GameInfoEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  currentSize: BingoSize;
  currentStatus: GameStatus;
  onSave: (data: { title: string; size?: BingoSize }) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const GameInfoEditModal: React.FC<GameInfoEditModalProps> = ({
  isOpen,
  currentTitle,
  currentSize,
  currentStatus,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [editingTitle, setEditingTitle] = useState(currentTitle);
  const [editingSize, setEditingSize] = useState(
    bingoSizeToNumber(currentSize)
  );

  useEffect(() => {
    setEditingTitle(currentTitle);
    setEditingSize(bingoSizeToNumber(currentSize));
  }, [currentTitle, currentSize, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      const data: { title: string; size?: BingoSize } = {
        title: editingTitle.trim(),
      };

      // 編集中ステータスの場合のみサイズを含める
      const currentSizeNum = bingoSizeToNumber(currentSize);
      if (
        currentStatus === GameStatus.EDITING &&
        editingSize !== currentSizeNum
      ) {
        data.size = numberToBingoSize(editingSize);
      }

      onSave(data);
    }
  };

  return (
    <Modal isOpen={isOpen} size="md" className="p-5">
      <div className="mt-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            ビンゴ情報を編集
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              ビンゴ名
            </label>
            <input
              type="text"
              id="title"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              autoFocus
              required
              disabled={isSaving}
            />
          </div>

          {currentStatus === GameStatus.EDITING && (
            <div className="mb-4">
              <label
                htmlFor="size"
                className="block text-sm font-medium text-gray-700"
              >
                ビンゴサイズ
              </label>
              <select
                id="size"
                value={editingSize}
                onChange={(e) => setEditingSize(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                disabled={isSaving}
              >
                <option value={3}>3x3</option>
                <option value={4}>4x4</option>
                <option value={5}>5x5</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                ※ サイズ変更は編集中のみ可能です
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="cursor-pointer rounded-sm bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!editingTitle.trim() || isSaving}
              className="cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
