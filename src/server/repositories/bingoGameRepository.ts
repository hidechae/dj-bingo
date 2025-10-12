import { type PrismaClient, Prisma } from "@prisma/client";
import {
  type BingoGameEntity,
  type BingoGameWithSongs,
  type BingoGameWithSongsAndParticipants,
  type BingoGameWithDetails,
  type BingoGameWithAdmins,
  type BingoGameFull,
  type CreateBingoGameInput,
  type UserEntity,
  BingoSize,
  GameStatus,
} from "~/domain/models";

type PrismaGame = Awaited<ReturnType<PrismaClient["bingoGame"]["findUnique"]>>;

type PrismaGameWithSongs = Prisma.BingoGameGetPayload<{
  include: { songs: true };
}>;

type PrismaGameWithSongsAndParticipants = Prisma.BingoGameGetPayload<{
  include: {
    songs: true;
    participants: true;
  };
}>;

type PrismaGameWithDetails = Prisma.BingoGameGetPayload<{
  include: {
    songs: true;
    participants: {
      include: {
        participantSongs: {
          include: {
            song: true;
          };
        };
      };
    };
    user: true;
  };
}>;

type PrismaGameWithAdmins = Prisma.BingoGameGetPayload<{
  include: {
    user: true;
    gameAdmins: {
      include: {
        user: true;
      };
    };
  };
}>;

type PrismaGameFull = Prisma.BingoGameGetPayload<{
  include: {
    songs: true;
    participants: {
      include: {
        participantSongs: {
          include: {
            song: true;
          };
        };
      };
    };
    user: true;
    gameAdmins: {
      include: {
        user: true;
      };
    };
  };
}>;

export class BingoGameRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<BingoGameEntity | null> {
    const game = await this.db.bingoGame.findUnique({
      where: { id },
    });

    if (!game) return null;
    return this.toDomain(game);
  }

  async findByIdWithSongs(id: string): Promise<BingoGameWithSongs | null> {
    const game = await this.db.bingoGame.findUnique({
      where: { id },
      include: { songs: true },
    });

    if (!game) return null;
    return this.toDomainWithSongs(game);
  }

  async findByIdWithDetails(id: string): Promise<BingoGameWithDetails | null> {
    const game = await this.db.bingoGame.findUnique({
      where: { id },
      include: {
        songs: true,
        participants: {
          include: {
            participantSongs: {
              include: {
                song: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!game) return null;
    return this.toDomainWithDetails(game);
  }

  async findByIdWithAdmins(id: string): Promise<BingoGameWithAdmins | null> {
    const game = await this.db.bingoGame.findUnique({
      where: { id },
      include: {
        user: true,
        gameAdmins: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!game) return null;
    return this.toDomainWithAdmins(game);
  }

  async findManyByUser(userId: string): Promise<BingoGameFull[]> {
    const games = await this.db.bingoGame.findMany({
      where: {
        OR: [
          { createdBy: userId },
          {
            gameAdmins: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        songs: true,
        participants: {
          include: {
            participantSongs: {
              include: {
                song: true,
              },
            },
          },
        },
        user: true,
        gameAdmins: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return games.map((g) => this.toDomainFull(g));
  }

  async create(
    input: CreateBingoGameInput,
    songs?: Array<{ title: string; artist?: string | null }>
  ): Promise<BingoGameWithSongsAndParticipants> {
    const game = await this.db.bingoGame.create({
      data: {
        title: input.title,
        size: input.size,
        status: input.status,
        createdBy: input.createdBy,
        ...(songs &&
          songs.length > 0 && {
            songs: {
              create: songs,
            },
          }),
      },
      include: {
        songs: true,
        participants: true,
      },
    });

    return this.toDomainWithSongsAndParticipants(game);
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      status: GameStatus;
    }>
  ): Promise<BingoGameWithDetails> {
    const game = await this.db.bingoGame.update({
      where: { id },
      data,
      include: {
        songs: true,
        participants: {
          include: {
            participantSongs: {
              include: {
                song: true,
              },
            },
          },
        },
        user: true,
      },
    });

    return this.toDomainWithDetails(game);
  }

  async delete(id: string): Promise<void> {
    await this.db.bingoGame.delete({
      where: { id },
    });
  }

  // Converter methods: Prisma -> Domain

  private toDomain(prismaGame: NonNullable<PrismaGame>): BingoGameEntity {
    return {
      id: prismaGame.id,
      title: prismaGame.title,
      size: prismaGame.size as BingoSize,
      status: prismaGame.status as GameStatus,
      createdAt: prismaGame.createdAt,
      updatedAt: prismaGame.updatedAt,
      createdBy: prismaGame.createdBy,
      isActive: prismaGame.isActive,
    };
  }

  private toDomainWithSongs(
    prismaGame: PrismaGameWithSongs
  ): BingoGameWithSongs {
    return {
      ...this.toDomain(prismaGame),
      songs: prismaGame.songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        bingoGameId: s.bingoGameId,
        isPlayed: s.isPlayed,
        playedAt: s.playedAt,
      })),
    };
  }

  private toDomainWithSongsAndParticipants(
    prismaGame: PrismaGameWithSongsAndParticipants
  ): BingoGameWithSongsAndParticipants {
    return {
      ...this.toDomainWithSongs(prismaGame),
      participants: prismaGame.participants.map((p) => ({
        id: p.id,
        name: p.name,
        sessionToken: p.sessionToken,
        bingoGameId: p.bingoGameId,
        createdAt: p.createdAt,
        isGridComplete: p.isGridComplete,
        hasWon: p.hasWon,
        wonAt: p.wonAt,
      })),
    };
  }

  private toDomainWithDetails(
    prismaGame: PrismaGameWithDetails
  ): BingoGameWithDetails {
    return {
      ...this.toDomain(prismaGame),
      songs: prismaGame.songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        bingoGameId: s.bingoGameId,
        isPlayed: s.isPlayed,
        playedAt: s.playedAt,
      })),
      participants: prismaGame.participants.map((p) => ({
        id: p.id,
        name: p.name,
        sessionToken: p.sessionToken,
        bingoGameId: p.bingoGameId,
        createdAt: p.createdAt,
        isGridComplete: p.isGridComplete,
        hasWon: p.hasWon,
        wonAt: p.wonAt,
        participantSongs: p.participantSongs.map((ps) => ({
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
          },
        })),
      })),
      user: this.toUserEntity(prismaGame.user),
    };
  }

  private toDomainWithAdmins(
    prismaGame: PrismaGameWithAdmins
  ): BingoGameWithAdmins {
    return {
      ...this.toDomain(prismaGame),
      user: this.toUserEntity(prismaGame.user),
      gameAdmins: prismaGame.gameAdmins.map((ga) => ({
        id: ga.id,
        bingoGameId: ga.bingoGameId,
        userId: ga.userId,
        addedBy: ga.addedBy,
        addedAt: ga.addedAt,
        user: this.toUserEntity(ga.user),
      })),
    };
  }

  private toDomainFull(prismaGame: PrismaGameFull): BingoGameFull {
    return {
      ...this.toDomainWithDetails(prismaGame),
      gameAdmins: prismaGame.gameAdmins.map((ga) => ({
        id: ga.id,
        bingoGameId: ga.bingoGameId,
        userId: ga.userId,
        addedBy: ga.addedBy,
        addedAt: ga.addedAt,
        user: this.toUserEntity(ga.user),
      })),
    };
  }

  private toUserEntity(prismaUser: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  }): UserEntity {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      emailVerified: prismaUser.emailVerified,
      image: prismaUser.image,
      // Don't include password for security
    };
  }
}
