import { type Song } from "~/types";

type SetupGridProps = {
  gridSize: number;
  selectedSongs: { [position: number]: string };
  selectedPosition: number | null;
  availableSongs: Song[];
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
    <div>
      <div
        className="grid gap-2 sm:gap-3 md:gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
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
  availableSongs: Song[];
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
  const song = songId ? availableSongs.find((s) => s.id === songId) : null;

  return (
    <div
      onClick={() => onSelect(position)}
      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 p-2 text-xs transition-all sm:p-3 sm:text-sm md:p-4 md:text-base ${
        isSelected
          ? "border-solid border-yellow-400 bg-yellow-100 shadow-md"
          : songId
            ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
            : "border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
      }`}
    >
      {song ? (
        <>
          <div className="flex h-full flex-col items-center justify-center pr-4 text-center">
            <div className="line-clamp-2 w-full text-xs font-medium break-words text-gray-900 sm:text-sm md:text-base">
              {song.title}
            </div>
            {song.artist && (
              <div className="mt-1 w-full truncate text-xs text-gray-600 sm:text-sm">
                {song.artist}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear(position);
            }}
            className="absolute top-1 right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors hover:bg-red-600 sm:h-5 sm:w-5 md:h-6 md:w-6"
            title="このマスをクリア"
          >
            ×
          </button>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-center text-gray-400">
          マス {position + 1}
        </div>
      )}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-yellow-500"></div>
      )}
    </div>
  );
};
