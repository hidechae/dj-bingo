import { type GridCell } from "~/types";

type BingoGridProps = {
  grid: (GridCell | null)[];
  gridSize: number;
};

export const BingoGrid = ({ grid, gridSize }: BingoGridProps) => {
  return (
    <div
      className="mx-auto grid max-w-md gap-2"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
    >
      {grid.map((cell, index: number) => (
        <div
          key={index}
          className={`aspect-square rounded-lg border-2 p-2 text-xs transition-all duration-300 ${
            cell?.isPlayed
              ? "scale-105 transform border-green-600 bg-green-500 text-white shadow-lg"
              : "border-gray-300 bg-white"
          }`}
        >
          <div className="flex h-full flex-col items-center justify-center text-center">
            {cell ? (
              <>
                <div
                  className={`text-xs font-medium ${
                    cell.isPlayed ? "text-white" : "text-gray-900"
                  }`}
                >
                  {cell.song.title}
                </div>
                {cell.song.artist && (
                  <div
                    className={`text-xs ${
                      cell.isPlayed ? "text-green-100" : "text-gray-600"
                    }`}
                  >
                    {cell.song.artist}
                  </div>
                )}
                {cell.isPlayed && (
                  <div className="mt-1 text-xs font-bold text-green-100">
                    ✓ 演奏済み
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400">空白</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
