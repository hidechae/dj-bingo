type BingoGridProps = {
  grid: any[];
  gridSize: number;
};

export const BingoGrid = ({ grid, gridSize }: BingoGridProps) => {
  return (
    <div
      className="grid gap-2 max-w-md mx-auto"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
    >
      {grid.map((cell: any, index: number) => (
        <div
          key={index}
          className={`aspect-square border-2 rounded-lg p-2 text-xs transition-all duration-300 ${
            cell?.isPlayed
              ? "bg-green-500 text-white border-green-600 shadow-lg transform scale-105"
              : "bg-white border-gray-300"
          }`}
        >
          <div className="h-full flex flex-col items-center justify-center text-center">
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
                  <div className="text-xs mt-1 font-bold text-green-100">
                    ✓ 演奏済み
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400 text-xs">空白</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
