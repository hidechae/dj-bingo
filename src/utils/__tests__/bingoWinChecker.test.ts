import { describe, it, expect } from "vitest";
import { checkWinCondition } from "../bingoWinChecker";

describe("checkWinCondition", () => {
  describe("3x3 grid", () => {
    const gridSize = 3;

    it("should return false for empty grid", () => {
      const grid = Array(9).fill(false);
      expect(checkWinCondition(grid, gridSize)).toBe(false);
    });

    it("should return true for winning first row", () => {
      const grid = [true, true, true, false, false, false, false, false, false];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning second row", () => {
      const grid = [false, false, false, true, true, true, false, false, false];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning third row", () => {
      const grid = [false, false, false, false, false, false, true, true, true];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning first column", () => {
      const grid = [true, false, false, true, false, false, true, false, false];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning second column", () => {
      const grid = [false, true, false, false, true, false, false, true, false];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning third column", () => {
      const grid = [false, false, true, false, false, true, false, false, true];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning diagonal (top-left to bottom-right)", () => {
      const grid = [true, false, false, false, true, false, false, false, true];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning diagonal (top-right to bottom-left)", () => {
      const grid = [false, false, true, false, true, false, true, false, false];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return false for almost winning row", () => {
      const grid = [
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(false);
    });

    it("should work with GridCell objects", () => {
      const grid = [
        {
          song: {
            id: "1",
            title: "Song 1",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        {
          song: {
            id: "2",
            title: "Song 2",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        {
          song: {
            id: "3",
            title: "Song 3",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        {
          song: {
            id: "4",
            title: "Song 4",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
        {
          song: {
            id: "5",
            title: "Song 5",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
        {
          song: {
            id: "6",
            title: "Song 6",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
        {
          song: {
            id: "7",
            title: "Song 7",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
        {
          song: {
            id: "8",
            title: "Song 8",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
        {
          song: {
            id: "9",
            title: "Song 9",
            artist: null,
            bingoGameId: "game1",
            isPlayed: false,
            playedAt: null,
          },
          isPlayed: false,
        },
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should handle null cells as not played", () => {
      const grid: (boolean | null)[] = [
        true,
        true,
        null,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      expect(checkWinCondition(grid as boolean[], gridSize)).toBe(false);
    });
  });

  describe("4x4 grid", () => {
    const gridSize = 4;

    it("should return true for winning first row", () => {
      const grid = [
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning second column", () => {
      const grid = [
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning main diagonal", () => {
      const grid = [
        true,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        true,
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return false for almost winning row", () => {
      const grid = [
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      expect(checkWinCondition(grid, gridSize)).toBe(false);
    });
  });

  describe("5x5 grid", () => {
    const gridSize = 5;

    it("should return true for winning middle row", () => {
      const grid = Array(25).fill(false);
      grid[10] = true;
      grid[11] = true;
      grid[12] = true;
      grid[13] = true;
      grid[14] = true;
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return true for winning anti-diagonal", () => {
      const grid = Array(25).fill(false);
      grid[4] = true; // top-right
      grid[8] = true;
      grid[12] = true; // center
      grid[16] = true;
      grid[20] = true; // bottom-left
      expect(checkWinCondition(grid, gridSize)).toBe(true);
    });

    it("should return false for empty 5x5 grid", () => {
      const grid = Array(25).fill(false);
      expect(checkWinCondition(grid, gridSize)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false for 1x1 empty grid", () => {
      expect(checkWinCondition([false], 1)).toBe(false);
    });

    it("should return true for 1x1 filled grid", () => {
      expect(checkWinCondition([true], 1)).toBe(true);
    });

    it("should return true for 2x2 grid with winning row", () => {
      const grid = [true, true, false, false];
      expect(checkWinCondition(grid, 2)).toBe(true);
    });

    it("should handle mixed null and GridCell objects", () => {
      const grid = [
        {
          song: {
            id: "1",
            title: "Song 1",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        {
          song: {
            id: "2",
            title: "Song 2",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        {
          song: {
            id: "3",
            title: "Song 3",
            artist: null,
            bingoGameId: "game1",
            isPlayed: true,
            playedAt: null,
          },
          isPlayed: true,
        },
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      expect(checkWinCondition(grid, 3)).toBe(true);
    });
  });
});
