// Song domain model

export type SongEntity = {
  id: string;
  title: string;
  artist: string | null;
  bingoGameId: string;
  isPlayed: boolean;
  playedAt: Date | null;
};

export type CreateSongInput = {
  title: string;
  artist?: string | null;
  bingoGameId: string;
};
