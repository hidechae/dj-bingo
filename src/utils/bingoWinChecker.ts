export const checkWinCondition = (grid: any[], gridSize: number): boolean => {
  // Check rows
  for (let i = 0; i < gridSize; i++) {
    let rowWin = true;
    for (let j = 0; j < gridSize; j++) {
      if (!grid[i * gridSize + j]?.isPlayed) {
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
      if (!grid[i * gridSize + j]?.isPlayed) {
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
    if (!grid[i * gridSize + i]?.isPlayed) diagWin1 = false;
    if (!grid[i * gridSize + (gridSize - 1 - i)]?.isPlayed) diagWin2 = false;
  }

  return diagWin1 || diagWin2;
};
