type SetupHeaderProps = {
  gameTitle: string;
  participantName: string;
  selectedCount: number;
  totalPositions: number;
  selectedPosition: number | null;
  onEditNameClick: () => void;
};

export const SetupHeader = ({
  gameTitle,
  participantName,
  selectedCount,
  totalPositions,
  onEditNameClick,
}: SetupHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">ビンゴ設定</h1>
      <h2 className="text-lg text-gray-700">{gameTitle}</h2>

      {/* 表示名表示・編集 */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-600">
          表示名: {participantName}
        </span>
        <button
          onClick={onEditNameClick}
          className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="表示名を変更"
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
