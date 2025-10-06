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
    <div className="mx-auto max-w-md rounded-lg border border-yellow-400 bg-yellow-100 p-3">
      <div className="text-center text-sm text-yellow-800">
        <strong>⚠️ グリッド未完成</strong>
        <br />
        {gameStatus === "ENTRY" && !continueWithIncompleteGrid ? (
          <>
            グリッド設定が未完成です。
            <br />
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={onGoToSetup}
                className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
              >
                設定を完成させる
              </button>
              <button
                onClick={onContinue}
                className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"
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
