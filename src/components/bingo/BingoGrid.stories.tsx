import type { Meta, StoryObj } from "@storybook/react";
import { BingoGrid } from "./BingoGrid";
import { type GridCell } from "~/types";

const meta = {
  title: "Bingo/BingoGrid",
  component: BingoGrid,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BingoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const createGridCell = (
  id: string,
  title: string,
  artist: string | null,
  isPlayed: boolean
): GridCell => ({
  song: {
    id,
    title,
    artist,
    bingoGameId: "game1",
    isPlayed,
    playedAt: isPlayed ? new Date() : null,
  },
  isPlayed,
});

// 3x3 Grid with no played songs
const emptyGrid3x3: (GridCell | null)[] = [
  createGridCell("1", "Song 1", "Artist 1", false),
  createGridCell("2", "Song 2", "Artist 2", false),
  createGridCell("3", "Song 3", "Artist 3", false),
  createGridCell("4", "Song 4", "Artist 4", false),
  createGridCell("5", "Song 5", "Artist 5", false),
  createGridCell("6", "Song 6", "Artist 6", false),
  createGridCell("7", "Song 7", "Artist 7", false),
  createGridCell("8", "Song 8", "Artist 8", false),
  createGridCell("9", "Song 9", "Artist 9", false),
];

// 3x3 Grid with some played songs
const partialGrid3x3: (GridCell | null)[] = [
  createGridCell("1", "Bohemian Rhapsody", "Queen", true),
  createGridCell("2", "Imagine", "John Lennon", true),
  createGridCell("3", "Shape of You", "Ed Sheeran", false),
  createGridCell("4", "Hotel California", "Eagles", true),
  createGridCell("5", "Billie Jean", "Michael Jackson", false),
  createGridCell("6", "Smells Like Teen Spirit", "Nirvana", false),
  createGridCell("7", "Sweet Child O' Mine", "Guns N' Roses", false),
  createGridCell("8", "Stairway to Heaven", "Led Zeppelin", false),
  createGridCell("9", "Hey Jude", "The Beatles", false),
];

// 3x3 Grid with winning row
const winningRow3x3: (GridCell | null)[] = [
  createGridCell("1", "Song 1", "Artist 1", true),
  createGridCell("2", "Song 2", "Artist 2", true),
  createGridCell("3", "Song 3", "Artist 3", true),
  createGridCell("4", "Song 4", "Artist 4", false),
  createGridCell("5", "Song 5", "Artist 5", false),
  createGridCell("6", "Song 6", "Artist 6", false),
  createGridCell("7", "Song 7", "Artist 7", false),
  createGridCell("8", "Song 8", "Artist 8", false),
  createGridCell("9", "Song 9", "Artist 9", false),
];

// 4x4 Grid
const grid4x4: (GridCell | null)[] = Array.from({ length: 16 }, (_, i) =>
  createGridCell(
    `${i + 1}`,
    `Song ${i + 1}`,
    `Artist ${i + 1}`,
    i < 4 // First row is played
  )
);

// 5x5 Grid
const grid5x5: (GridCell | null)[] = Array.from({ length: 25 }, (_, i) =>
  createGridCell(
    `${i + 1}`,
    `Song ${i + 1}`,
    `Artist ${i + 1}`,
    i % 5 === 0 // First column is played
  )
);

// Grid with incomplete setup
const incompleteGrid3x3: (GridCell | null)[] = [
  createGridCell("1", "Song 1", "Artist 1", false),
  createGridCell("2", "Song 2", "Artist 2", false),
  null,
  createGridCell("4", "Song 4", "Artist 4", false),
  null,
  createGridCell("6", "Song 6", "Artist 6", false),
  null,
  null,
  createGridCell("9", "Song 9", "Artist 9", false),
];

export const Grid3x3Empty: Story = {
  args: {
    grid: emptyGrid3x3,
    gridSize: 3,
  },
};

export const Grid3x3Partial: Story = {
  args: {
    grid: partialGrid3x3,
    gridSize: 3,
  },
};

export const Grid3x3WinningRow: Story = {
  args: {
    grid: winningRow3x3,
    gridSize: 3,
  },
};

export const Grid3x3Incomplete: Story = {
  args: {
    grid: incompleteGrid3x3,
    gridSize: 3,
  },
};

export const Grid4x4: Story = {
  args: {
    grid: grid4x4,
    gridSize: 4,
  },
};

export const Grid5x5: Story = {
  args: {
    grid: grid5x5,
    gridSize: 5,
  },
};

export const Interactive: Story = {
  args: {
    grid: partialGrid3x3,
    gridSize: 3,
    onCellClick: (cell: GridCell) => alert(`Clicked: ${cell.song.title}`),
  },
};

export const AllSizes: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-lg font-semibold">3x3 Grid</h3>
        <BingoGrid grid={partialGrid3x3} gridSize={3} />
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">4x4 Grid</h3>
        <BingoGrid grid={grid4x4} gridSize={4} />
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">5x5 Grid</h3>
        <BingoGrid grid={grid5x5} gridSize={5} />
      </div>
    </div>
  ),
};
