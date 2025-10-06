import { checkWinCondition } from "~/utils/bingoWinChecker";

type WinStatusProps = {
  hasWon: boolean;
  wonAt?: Date | null;
  grid: any[];
  gridSize: number;
};

export const WinStatus = ({
  hasWon,
  wonAt,
  grid,
  gridSize,
}: WinStatusProps) => {
  if (hasWon) {
    return (
      <div className="rounded-lg border border-yellow-400 bg-yellow-100 p-4">
        <div className="text-lg font-bold text-yellow-800">
          🏆 ビンゴ達成！ 🏆
        </div>
        <div className="mt-1 text-sm text-yellow-700">
          勝利時刻: {wonAt ? new Date(wonAt).toLocaleString() : ""}
        </div>
      </div>
    );
  }

  if (checkWinCondition(grid, gridSize)) {
    return (
      <div className="rounded-lg border border-green-400 bg-green-100 p-4">
        <div className="font-bold text-green-800">
          ビンゴ達成の可能性があります！
        </div>
        <div className="mt-1 text-sm text-green-700">
          システムが確認中です...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-400 bg-blue-100 p-4">
      <div className="font-bold text-blue-800">ゲーム進行中</div>
      <div className="mt-1 text-sm text-blue-700">DJの選曲をお待ちください</div>
    </div>
  );
};
