import {
  type PrismaClient,
  type Participant as PrismaParticipant,
} from "@prisma/client";
import {
  type ParticipantEntity,
  type ParticipantWithSongs,
  type CreateParticipantInput,
  type SongEntity,
  type ParticipantSongWithSong,
} from "~/domain/models";

type PrismaParticipantWithSongs = PrismaParticipant & {
  participantSongs: Array<{
    id: string;
    participantId: string;
    songId: string;
    position: number;
    song: {
      id: string;
      title: string;
      artist: string | null;
      bingoGameId: string;
      isPlayed: boolean;
      playedAt: Date | null;
    };
  }>;
};

export class ParticipantRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<ParticipantEntity | null> {
    const participant = await this.db.participant.findUnique({
      where: { id },
    });
    if (!participant) return null;
    return this.toDomain(participant);
  }

  async findBySessionTokenAndGameId(
    sessionToken: string,
    bingoGameId: string
  ): Promise<ParticipantEntity | null> {
    const participant = await this.db.participant.findUnique({
      where: {
        sessionToken_bingoGameId: {
          sessionToken,
          bingoGameId,
        },
      },
    });
    if (!participant) return null;
    return this.toDomain(participant);
  }

  async findFirst(where: {
    sessionToken?: string;
    bingoGameId?: string;
  }): Promise<ParticipantEntity | null> {
    const participant = await this.db.participant.findFirst({
      where,
    });
    if (!participant) return null;
    return this.toDomain(participant);
  }

  async findFirstWithSongs(where: {
    sessionToken?: string;
    bingoGameId?: string;
  }): Promise<ParticipantWithSongs | null> {
    const participant = await this.db.participant.findFirst({
      where,
      include: {
        participantSongs: {
          include: {
            song: true,
          },
        },
      },
    });
    if (!participant) return null;
    return this.toDomainWithSongs(participant as PrismaParticipantWithSongs);
  }

  async findMany(where?: {
    bingoGameId?: string;
  }): Promise<ParticipantEntity[]> {
    const participants = await this.db.participant.findMany({
      where,
    });
    return participants.map((p) => this.toDomain(p));
  }

  async findManyWithSongs(where?: {
    bingoGameId?: string;
  }): Promise<ParticipantWithSongs[]> {
    const participants = await this.db.participant.findMany({
      where,
      include: {
        participantSongs: {
          include: {
            song: true,
          },
        },
      },
    });
    return participants.map((p) =>
      this.toDomainWithSongs(p as PrismaParticipantWithSongs)
    );
  }

  async findManyWithSelect(
    where?: { bingoGameId?: string },
    select?: { name?: boolean }
  ): Promise<Array<{ name: string }>> {
    const participants = await this.db.participant.findMany({
      where,
      select: select ?? { name: true },
    });
    return participants;
  }

  async create(input: CreateParticipantInput): Promise<ParticipantEntity> {
    const participant = await this.db.participant.create({
      data: {
        name: input.name,
        sessionToken: input.sessionToken,
        bingoGameId: input.bingoGameId,
      },
    });
    return this.toDomain(participant);
  }

  async update(
    id: string,
    data: {
      name?: string;
      isGridComplete?: boolean;
      hasWon?: boolean;
      wonAt?: Date | null;
    }
  ): Promise<ParticipantEntity> {
    const participant = await this.db.participant.update({
      where: { id },
      data,
    });
    return this.toDomain(participant);
  }

  async updateMany(
    where: { bingoGameId?: string },
    data: {
      isGridComplete?: boolean;
      hasWon?: boolean;
      wonAt?: Date | null;
    }
  ): Promise<number> {
    const result = await this.db.participant.updateMany({
      where,
      data,
    });
    return result.count;
  }

  async deleteMany(where: { bingoGameId?: string }): Promise<number> {
    const result = await this.db.participant.deleteMany({
      where,
    });
    return result.count;
  }

  async delete(id: string): Promise<ParticipantEntity> {
    const participant = await this.db.participant.delete({
      where: { id },
    });
    return this.toDomain(participant);
  }

  private toDomain(prismaParticipant: PrismaParticipant): ParticipantEntity {
    return {
      id: prismaParticipant.id,
      name: prismaParticipant.name,
      sessionToken: prismaParticipant.sessionToken,
      bingoGameId: prismaParticipant.bingoGameId,
      createdAt: prismaParticipant.createdAt,
      isGridComplete: prismaParticipant.isGridComplete,
      hasWon: prismaParticipant.hasWon,
      wonAt: prismaParticipant.wonAt,
    };
  }

  private toDomainWithSongs(
    prismaParticipant: PrismaParticipantWithSongs
  ): ParticipantWithSongs {
    return {
      ...this.toDomain(prismaParticipant),
      participantSongs: prismaParticipant.participantSongs.map((ps) => ({
        id: ps.id,
        participantId: ps.participantId,
        songId: ps.songId,
        position: ps.position,
        song: {
          id: ps.song.id,
          title: ps.song.title,
          artist: ps.song.artist,
          bingoGameId: ps.song.bingoGameId,
          isPlayed: ps.song.isPlayed,
          playedAt: ps.song.playedAt,
        } as SongEntity,
      })) as ParticipantSongWithSong[],
    };
  }
}
