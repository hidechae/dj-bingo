import { type PrismaClient } from "@prisma/client";
import { BingoGameRepository } from "./bingoGameRepository";
import { SongRepository } from "./songRepository";
import { ParticipantRepository } from "./participantRepository";
import { ParticipantSongRepository } from "./participantSongRepository";
import { UserRepository } from "./userRepository";
import { GameAdminRepository } from "./gameAdminRepository";

export class Repositories {
  public readonly bingoGame: BingoGameRepository;
  public readonly song: SongRepository;
  public readonly participant: ParticipantRepository;
  public readonly participantSong: ParticipantSongRepository;
  public readonly user: UserRepository;
  public readonly gameAdmin: GameAdminRepository;

  constructor(db: PrismaClient) {
    this.bingoGame = new BingoGameRepository(db);
    this.song = new SongRepository(db);
    this.participant = new ParticipantRepository(db);
    this.participantSong = new ParticipantSongRepository(db);
    this.user = new UserRepository(db);
    this.gameAdmin = new GameAdminRepository(db);
  }
}

export function createRepositories(db: PrismaClient): Repositories {
  return new Repositories(db);
}

export * from "./bingoGameRepository";
export * from "./songRepository";
export * from "./participantRepository";
export * from "./participantSongRepository";
export * from "./userRepository";
export * from "./gameAdminRepository";
