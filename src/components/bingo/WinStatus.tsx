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
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
        <div className="text-yellow-800 font-bold text-lg">
          🏆 ビンゴ達成！ 🏆
        </div>
        <div className="text-yellow-700 text-sm mt-1">
          勝利時刻:{" "}
          {wonAt ? new Date(wonAt).toLocaleString() : ""}
        </div>
      </div>
    );
  }

  if (checkWinCondition(grid, gridSize)) {
    return (
      <div className="bg-green-100 border border-green-400 rounded-lg p-4">
        <div className="text-green-800 font-bold">
          ビンゴ達成の可能性があります！
        </div>
        <div className="text-green-700 text-sm mt-1">
          システムが確認中です...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-400 rounded-lg p-4">
      <div className="text-blue-800 font-bold">ゲーム進行中</div>
      <div className="text-blue-700 text-sm mt-1">DJの選曲をお待ちください</div>
    </div>
  );
};
