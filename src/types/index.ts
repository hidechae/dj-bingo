// Shared types and enums for the DJ Bingo application

import {
  type BingoGameWithDetails,
  type SongEntity,
  type ParticipantWithSongs,
  type ParticipantSongWithSong,
  BingoSize,
  GameStatus,
} from "~/domain/models";

// Re-export domain types for backward compatibility
export type BingoGame = BingoGameWithDetails;
export type Song = SongEntity;
export type Participant = ParticipantWithSongs;
export type ParticipantSong = ParticipantSongWithSong;

// Grid cell type used in play screen
export type GridCell = {
  song: Song;
  isPlayed: boolean;
};

// Simplified participant type for incomplete grid warnings
export type IncompleteParticipant = {
  id: string;
  name: string;
  createdAt: Date;
};

// Export domain enums
export { BingoSize, GameStatus };

// Enum values for Zod validation
export const BingoSizeValues = [
  "THREE_BY_THREE",
  "FOUR_BY_FOUR",
  "FIVE_BY_FIVE",
] as const;

export const GameStatusValues = [
  "EDITING",
  "ENTRY",
  "PLAYING",
  "FINISHED",
] as const;

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
    case GameStatus.EDITING:
      return { text: "編集中", color: "bg-gray-100 text-gray-800" };
    case GameStatus.ENTRY:
      return { text: "エントリー中", color: "bg-blue-100 text-blue-800" };
    case GameStatus.PLAYING:
      return { text: "ゲーム中", color: "bg-green-100 text-green-800" };
    case GameStatus.FINISHED:
      return { text: "終了", color: "bg-red-100 text-red-800" };
  }
}

// Status transition validation
export function isValidStatusTransition(
  currentStatus: GameStatus,
  newStatus: GameStatus
): boolean {
  // Define allowed transitions
  const allowedTransitions: Record<GameStatus, GameStatus[]> = {
    [GameStatus.EDITING]: [GameStatus.ENTRY],
    [GameStatus.ENTRY]: [GameStatus.EDITING, GameStatus.PLAYING],
    [GameStatus.PLAYING]: [GameStatus.ENTRY, GameStatus.FINISHED],
    [GameStatus.FINISHED]: [GameStatus.PLAYING],
  };

  return (allowedTransitions[currentStatus]?.indexOf(newStatus) ?? -1) !== -1;
}
