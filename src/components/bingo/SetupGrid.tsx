type SetupGridProps = {
  gridSize: number;
  selectedSongs: { [position: number]: string };
  selectedPosition: number | null;
  availableSongs: any[];
  onPositionSelect: (position: number) => void;
  onClearPosition: (position: number) => void;
};

export const SetupGrid = ({
  gridSize,
  selectedSongs,
  selectedPosition,
  availableSongs,
  onPositionSelect,
  onClearPosition,
}: SetupGridProps) => {
  const totalPositions = gridSize * gridSize;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">ビンゴグリッド</h3>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {Array.from({ length: totalPositions }, (_, index) => (
          <GridCell
            key={index}
            position={index}
            isSelected={selectedPosition === index}
            songId={selectedSongs[index]}
            availableSongs={availableSongs}
            onSelect={onPositionSelect}
            onClear={onClearPosition}
          />
        ))}
      </div>
    </div>
  );
};

type GridCellProps = {
  position: number;
  isSelected: boolean;
  songId?: string;
  availableSongs: any[];
  onSelect: (position: number) => void;
  onClear: (position: number) => void;
};

const GridCell = ({
  position,
  isSelected,
  songId,
  availableSongs,
  onSelect,
  onClear,
}: GridCellProps) => {
  const song = songId
    ? availableSongs.find((s: any) => s.id === songId)
    : null;

  return (
    <div
      onClick={() => onSelect(position)}
      className={`aspect-square border-2 rounded-lg p-2 text-xs cursor-pointer transition-all relative ${
        isSelected
          ? "bg-yellow-100 border-yellow-400 border-solid shadow-md"
          : songId
            ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
            : "bg-gray-50 border-gray-300 border-dashed hover:bg-gray-100"
      }`}
    >
      {song ? (
        <>
          <div className="h-full flex flex-col items-center justify-center text-center pr-4">
            <div className="text-xs font-medium text-gray-900">
              {song.title}
            </div>
            {song.artist && (
              <div className="text-xs text-gray-600 mt-1">{song.artist}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear(position);
            }}
            className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
            title="このマスをクリア"
          >
            ×
          </button>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-center">
          マス {position + 1}
        </div>
      )}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
};
