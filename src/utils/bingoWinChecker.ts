import { type GridCell } from "~/types";

/**
 * Check if a bingo grid has a winning condition (row, column, or diagonal)
 * @param grid - Grid with cell data or boolean array
 * @param gridSize - Size of the grid (e.g., 3 for 3x3)
 * @returns true if there is a winning condition
 */
export function checkWinCondition(
  grid: (GridCell | null)[] | boolean[],
  gridSize: number
): boolean {
  // Check rows
  for (let i = 0; i < gridSize; i++) {
    let rowWin = true;
    for (let j = 0; j < gridSize; j++) {
      const cell = grid[i * gridSize + j];
      const isPlayed =
        typeof cell === "boolean" ? cell : (cell?.isPlayed ?? false);
      if (!isPlayed) {
        rowWin = false;
        break;
      }
    }
    if (rowWin) return true;
  }

  // Check columns
  for (let j = 0; j < gridSize; j++) {
    let colWin = true;
    for (let i = 0; i < gridSize; i++) {
      const cell = grid[i * gridSize + j];
      const isPlayed =
        typeof cell === "boolean" ? cell : (cell?.isPlayed ?? false);
      if (!isPlayed) {
        colWin = false;
        break;
      }
    }
    if (colWin) return true;
  }

  // Check diagonals
  let diagWin1 = true;
  let diagWin2 = true;
  for (let i = 0; i < gridSize; i++) {
    const cell1 = grid[i * gridSize + i];
    const cell2 = grid[i * gridSize + (gridSize - 1 - i)];
    const isPlayed1 =
      typeof cell1 === "boolean" ? cell1 : (cell1?.isPlayed ?? false);
    const isPlayed2 =
      typeof cell2 === "boolean" ? cell2 : (cell2?.isPlayed ?? false);

    if (!isPlayed1) diagWin1 = false;
    if (!isPlayed2) diagWin2 = false;
  }

  return diagWin1 || diagWin2;
}
