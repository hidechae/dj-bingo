import { type BingoSize, type GameStatus } from "./common";
import { type SongEntity } from "./Song";
import {
  type ParticipantEntity,
  type ParticipantWithSongs,
} from "./Participant";
import { type UserEntity } from "./User";
import { type GameAdminWithUser } from "./GameAdmin";

// BingoGame domain model

export type BingoGameEntity = {
  id: string;
  title: string;
  size: BingoSize;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
};

export type BingoGameWithSongs = BingoGameEntity & {
  songs: SongEntity[];
};

export type BingoGameWithParticipants = BingoGameEntity & {
  participants: ParticipantEntity[];
};

export type BingoGameWithSongsAndParticipants = BingoGameEntity & {
  songs: SongEntity[];
  participants: ParticipantEntity[];
};

export type BingoGameWithDetails = BingoGameEntity & {
  songs: SongEntity[];
  participants: ParticipantWithSongs[];
  user: UserEntity;
};

export type BingoGameWithAdmins = BingoGameEntity & {
  user: UserEntity;
  gameAdmins: GameAdminWithUser[];
};

export type BingoGameFull = BingoGameEntity & {
  songs: SongEntity[];
  participants: ParticipantWithSongs[];
  user: UserEntity;
  gameAdmins: GameAdminWithUser[];
};

export type CreateBingoGameInput = {
  title: string;
  size: BingoSize;
  status: GameStatus;
  createdBy: string;
};
