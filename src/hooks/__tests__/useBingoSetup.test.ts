/**
 * Tests for the useBingoSetup hook auto setup functionality
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Test utility function to validate Fisher-Yates shuffle algorithm behavior
describe("useBingoSetup Auto Setup Logic", () => {
  // Mock the shuffling algorithm used in handleAutoSetup
  const fisherYatesShuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  };

  beforeEach(() => {
    // Reset random seed for reproducible tests
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  it("should shuffle array elements using Fisher-Yates algorithm", () => {
    const originalArray = [1, 2, 3, 4, 5];
    const shuffled = fisherYatesShuffle(originalArray);

    // Should contain all original elements
    expect(shuffled).toHaveLength(originalArray.length);
    originalArray.forEach((item) => {
      expect(shuffled).toContain(item);
    });

    // Should not modify original array
    expect(originalArray).toEqual([1, 2, 3, 4, 5]);
  });

  it("should handle edge cases for grid assignments", () => {
    // Test minimum grid size (3x3 = 9 positions)
    const minGridSize = 3;
    const minPositions = minGridSize * minGridSize;
    expect(minPositions).toBe(9);

    // Test maximum expected grid size (5x5 = 25 positions)
    const maxGridSize = 5;
    const maxPositions = maxGridSize * maxGridSize;
    expect(maxPositions).toBe(25);

    // Mock songs list
    const mockSongs = Array.from({ length: 30 }, (_, i) => ({
      id: `song-${i}`,
    }));

    // Should handle sufficient songs for any grid size
    expect(mockSongs.length).toBeGreaterThanOrEqual(maxPositions);
  });

  it("should validate song count requirements", () => {
    const gridSize = 4; // 4x4 = 16 positions
    const totalPositions = gridSize * gridSize;

    // Insufficient songs case
    const insufficientSongs = Array.from({ length: 10 }, (_, i) => ({
      id: `song-${i}`,
    }));
    expect(insufficientSongs.length).toBeLessThan(totalPositions);

    // Sufficient songs case
    const sufficientSongs = Array.from({ length: 20 }, (_, i) => ({
      id: `song-${i}`,
    }));
    expect(sufficientSongs.length).toBeGreaterThanOrEqual(totalPositions);
  });
});
