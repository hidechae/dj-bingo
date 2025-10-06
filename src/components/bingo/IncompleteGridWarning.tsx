type IncompleteGridWarningProps = {
  isGridComplete: boolean;
  gameStatus: string;
  gameId: string | string[] | undefined;
  continueWithIncompleteGrid: boolean;
  onContinue: () => void;
  onGoToSetup: () => void;
};

export const IncompleteGridWarning = ({
  isGridComplete,
  gameStatus,
  gameId,
  continueWithIncompleteGrid,
  onContinue,
  onGoToSetup,
}: IncompleteGridWarningProps) => {
  if (isGridComplete) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mx-auto max-w-md">
      <div className="text-yellow-800 text-sm text-center">
        <strong>⚠️ グリッド未完成</strong>
        <br />
        {gameStatus === "ENTRY" && !continueWithIncompleteGrid ? (
          <>
            グリッド設定が未完成です。
            <br />
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={onGoToSetup}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                設定を完成させる
              </button>
              <button
                onClick={onContinue}
                className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
              >
                このまま続ける
              </button>
            </div>
          </>
        ) : (
          <>
            ゲーム開始時にグリッド設定が完了していませんでした。
            <br />
            空白のマスではビンゴになりません。
          </>
        )}
      </div>
    </div>
  );
};
