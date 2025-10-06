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
  selectedPosition,
}: SetupHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ビンゴ設定</h1>
      <h2 className="text-lg text-gray-700">{gameTitle}</h2>
      <p className="text-sm text-gray-500 mt-2">
        各マスに楽曲を選択してください ({selectedCount}/{totalPositions})
      </p>
      <p className="text-xs text-blue-600 mt-1">
        {selectedPosition !== null
          ? `マス${selectedPosition + 1}が選択されています。楽曲を選んでください。`
          : "まずマスを選択してから、楽曲を選んでください。"}
      </p>
    </div>
  );
};
