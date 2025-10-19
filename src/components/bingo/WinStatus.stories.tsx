import type { Meta, StoryObj } from "@storybook/react";
import { WinStatus } from "./WinStatus";
import { type GridCell } from "~/types";

const meta = {
  title: "Bingo/WinStatus",
  component: WinStatus,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WinStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

const createGridCell = (
  id: string,
  title: string,
  isPlayed: boolean
): GridCell => ({
  song: {
    id,
    title,
    artist: null,
    bingoGameId: "game1",
    isPlayed,
    playedAt: null,
  },
  isPlayed,
});

// Winning row grid
const winningGrid: (GridCell | null)[] = [
  createGridCell("1", "Song 1", true),
  createGridCell("2", "Song 2", true),
  createGridCell("3", "Song 3", true),
  createGridCell("4", "Song 4", false),
  createGridCell("5", "Song 5", false),
  createGridCell("6", "Song 6", false),
  createGridCell("7", "Song 7", false),
  createGridCell("8", "Song 8", false),
  createGridCell("9", "Song 9", false),
];

// No win grid
const noWinGrid: (GridCell | null)[] = [
  createGridCell("1", "Song 1", true),
  createGridCell("2", "Song 2", true),
  createGridCell("3", "Song 3", false),
  createGridCell("4", "Song 4", false),
  createGridCell("5", "Song 5", false),
  createGridCell("6", "Song 6", false),
  createGridCell("7", "Song 7", false),
  createGridCell("8", "Song 8", false),
  createGridCell("9", "Song 9", false),
];

export const HasWon: Story = {
  args: {
    hasWon: true,
    wonAt: new Date("2024-01-15T10:30:00"),
    grid: winningGrid,
    gridSize: 3,
  },
};

export const NotWon: Story = {
  args: {
    hasWon: false,
    wonAt: null,
    grid: noWinGrid,
    gridSize: 3,
  },
};

export const RecentWin: Story = {
  args: {
    hasWon: true,
    wonAt: new Date(),
    grid: winningGrid,
    gridSize: 3,
  },
};

export const States: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Winner State</h3>
        <WinStatus
          hasWon={true}
          wonAt={new Date("2024-01-15T10:30:00")}
          grid={winningGrid}
          gridSize={3}
        />
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Not Won State</h3>
        <WinStatus hasWon={false} wonAt={null} grid={noWinGrid} gridSize={3} />
      </div>
    </div>
  ),
};
