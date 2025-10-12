import {
  type PrismaClient,
  type ParticipantSong as PrismaParticipantSong,
} from "@prisma/client";
import {
  type ParticipantSongEntity,
  type ParticipantSongWithSong,
  type CreateParticipantSongInput,
  type SongEntity,
} from "~/domain/models";

type PrismaParticipantSongWithSong = PrismaParticipantSong & {
  song: {
    id: string;
    title: string;
    artist: string | null;
    bingoGameId: string;
    isPlayed: boolean;
    playedAt: Date | null;
  };
};

export class ParticipantSongRepository {
  constructor(private db: PrismaClient) {}

  async findMany(where?: {
    participantId?: string;
    songId?: string;
  }): Promise<ParticipantSongEntity[]> {
    const participantSongs = await this.db.participantSong.findMany({
      where,
    });
    return participantSongs.map((ps) => this.toDomain(ps));
  }

  async findManyWithSong(where?: {
    participantId?: string;
    songId?: string;
  }): Promise<ParticipantSongWithSong[]> {
    const participantSongs = await this.db.participantSong.findMany({
      where,
      include: {
        song: true,
      },
    });
    return participantSongs.map((ps) =>
      this.toDomainWithSong(ps as PrismaParticipantSongWithSong)
    );
  }

  async create(
    input: CreateParticipantSongInput
  ): Promise<ParticipantSongEntity> {
    const participantSong = await this.db.participantSong.create({
      data: {
        participantId: input.participantId,
        songId: input.songId,
        position: input.position,
      },
    });
    return this.toDomain(participantSong);
  }

  async createMany(songs: CreateParticipantSongInput[]): Promise<number> {
    const result = await this.db.participantSong.createMany({
      data: songs.map((song) => ({
        participantId: song.participantId,
        songId: song.songId,
        position: song.position,
      })),
    });
    return result.count;
  }

  async deleteMany(where: { participantId?: string }): Promise<number> {
    const result = await this.db.participantSong.deleteMany({
      where,
    });
    return result.count;
  }

  async delete(id: string): Promise<ParticipantSongEntity> {
    const participantSong = await this.db.participantSong.delete({
      where: { id },
    });
    return this.toDomain(participantSong);
  }

  private toDomain(
    prismaParticipantSong: PrismaParticipantSong
  ): ParticipantSongEntity {
    return {
      id: prismaParticipantSong.id,
      participantId: prismaParticipantSong.participantId,
      songId: prismaParticipantSong.songId,
      position: prismaParticipantSong.position,
    };
  }

  private toDomainWithSong(
    prismaParticipantSong: PrismaParticipantSongWithSong
  ): ParticipantSongWithSong {
    return {
      ...this.toDomain(prismaParticipantSong),
      song: {
        id: prismaParticipantSong.song.id,
        title: prismaParticipantSong.song.title,
        artist: prismaParticipantSong.song.artist,
        bingoGameId: prismaParticipantSong.song.bingoGameId,
        isPlayed: prismaParticipantSong.song.isPlayed,
        playedAt: prismaParticipantSong.song.playedAt,
      } as SongEntity,
    };
  }
}
