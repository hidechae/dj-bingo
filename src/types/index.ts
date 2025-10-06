// Shared types and enums for the DJ Bingo application

export enum BingoSize {
  THREE_BY_THREE = "THREE_BY_THREE",
  FOUR_BY_FOUR = "FOUR_BY_FOUR", 
  FIVE_BY_FIVE = "FIVE_BY_FIVE"
}

export enum GameStatus {
  EDITING = "EDITING",
  ENTRY = "ENTRY",
  PLAYING = "PLAYING", 
  FINISHED = "FINISHED"
}

// Helper functions for bingo game logic

export function getGridSize(size: BingoSize): number {
  switch (size) {
    case BingoSize.THREE_BY_THREE:
      return 3;
    case BingoSize.FOUR_BY_FOUR:
      return 4;
    case BingoSize.FIVE_BY_FIVE:
      return 5;
    default:
      return 3;
  }
}

export function getRequiredSongCount(size: BingoSize): number {
  const gridSize = getGridSize(size);
  return gridSize * gridSize;
}

export function getStatusDisplay(status: GameStatus) {
  switch (status) {
    case GameStatus.EDITING: return { text: "編集中", color: "bg-gray-100 text-gray-800" };
    case GameStatus.ENTRY: return { text: "エントリー中", color: "bg-blue-100 text-blue-800" };
    case GameStatus.PLAYING: return { text: "ゲーム中", color: "bg-green-100 text-green-800" };
    case GameStatus.FINISHED: return { text: "終了", color: "bg-red-100 text-red-800" };
  }
}

// Status transition validation
export function isValidStatusTransition(currentStatus: GameStatus, newStatus: GameStatus): boolean {
  // Define allowed transitions
  const allowedTransitions: Record<GameStatus, GameStatus[]> = {
    [GameStatus.EDITING]: [GameStatus.ENTRY],
    [GameStatus.ENTRY]: [GameStatus.EDITING, GameStatus.PLAYING],
    [GameStatus.PLAYING]: [GameStatus.ENTRY, GameStatus.FINISHED],
    [GameStatus.FINISHED]: [GameStatus.PLAYING],
  };

  return (allowedTransitions[currentStatus]?.indexOf(newStatus) ?? -1) !== -1;
}