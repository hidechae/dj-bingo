import { useState } from "react";

type SetupHeaderProps = {
  gameTitle: string;
  participantName: string;
  selectedCount: number;
  totalPositions: number;
  selectedPosition: number | null;
  onNameChange: (newName: string) => void;
  isUpdatingName: boolean;
};

export const SetupHeader = ({
  gameTitle,
  participantName,
  selectedCount,
  totalPositions,
  onNameChange,
  isUpdatingName,
}: SetupHeaderProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(participantName);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim() && editingName.trim() !== participantName) {
      onNameChange(editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancel = () => {
    setEditingName(participantName);
    setIsEditingName(false);
  };

  return (
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">ビンゴ設定</h1>
      <h2 className="text-lg text-gray-700">{gameTitle}</h2>

      {/* 参加者名表示・編集 */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              autoFocus
              required
              disabled={isUpdatingName}
            />
            <button
              type="submit"
              disabled={!editingName.trim() || isUpdatingName}
              className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingName ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUpdatingName}
              className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-600">
              参加者: {participantName}
            </span>
            <button
              onClick={() => setIsEditingName(true)}
              className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="名前を変更"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-500">
        各マスに楽曲を選択してください ({selectedCount}/{totalPositions})
      </p>
      <p className="mt-1 text-xs text-blue-600">
        マスをクリックすると楽曲選択モーダルが開きます
      </p>
    </div>
  );
};
