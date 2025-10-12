import { type SongEntity } from "./Song";

// Participant domain model

export type ParticipantEntity = {
  id: string;
  name: string;
  sessionToken: string;
  bingoGameId: string;
  createdAt: Date;
  isGridComplete: boolean;
  hasWon: boolean;
  wonAt: Date | null;
};

export type ParticipantSongEntity = {
  id: string;
  participantId: string;
  songId: string;
  position: number;
};

export type ParticipantSongWithSong = ParticipantSongEntity & {
  song: SongEntity;
};

export type ParticipantWithSongs = ParticipantEntity & {
  participantSongs: ParticipantSongWithSong[];
};

export type CreateParticipantInput = {
  name: string;
  sessionToken: string;
  bingoGameId: string;
};

export type CreateParticipantSongInput = {
  participantId: string;
  songId: string;
  position: number;
};
