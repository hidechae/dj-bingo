type SetupHeaderProps = {
  gameTitle: string;
  selectedCount: number;
  totalPositions: number;
  selectedPosition: number | null;
};

export const SetupHeader = ({
  gameTitle,
  selectedCount,
  totalPositions,
}: SetupHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">ビンゴ設定</h1>
      <h2 className="text-lg text-gray-700">{gameTitle}</h2>
      <p className="mt-2 text-sm text-gray-500">
        各マスに楽曲を選択してください ({selectedCount}/{totalPositions})
      </p>
      <p className="mt-1 text-xs text-blue-600">
        マスをクリックすると楽曲選択モーダルが開きます
      </p>
    </div>
  );
};
