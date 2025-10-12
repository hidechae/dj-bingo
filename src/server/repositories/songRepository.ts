import { type PrismaClient, type Song as PrismaSong } from "@prisma/client";
import { type SongEntity, type CreateSongInput } from "~/domain/models";

export class SongRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<SongEntity | null> {
    const song = await this.db.song.findUnique({
      where: { id },
    });
    if (!song) return null;
    return this.toDomain(song);
  }

  async findMany(where?: { bingoGameId?: string }): Promise<SongEntity[]> {
    const songs = await this.db.song.findMany({
      where,
      orderBy: { title: "asc" },
    });
    return songs.map((song) => this.toDomain(song));
  }

  async create(input: CreateSongInput): Promise<SongEntity> {
    const song = await this.db.song.create({
      data: {
        title: input.title,
        artist: input.artist ?? null,
        bingoGameId: input.bingoGameId,
      },
    });
    return this.toDomain(song);
  }

  async createMany(songs: CreateSongInput[]): Promise<number> {
    const result = await this.db.song.createMany({
      data: songs.map((song) => ({
        title: song.title,
        artist: song.artist ?? null,
        bingoGameId: song.bingoGameId,
      })),
    });
    return result.count;
  }

  async update(
    id: string,
    data: {
      title?: string;
      artist?: string | null;
      isPlayed?: boolean;
      playedAt?: Date | null;
    }
  ): Promise<SongEntity> {
    const song = await this.db.song.update({
      where: { id },
      data,
    });
    return this.toDomain(song);
  }

  async updateMany(
    where: { bingoGameId?: string },
    data: {
      isPlayed?: boolean;
      playedAt?: Date | null;
    }
  ): Promise<number> {
    const result = await this.db.song.updateMany({
      where,
      data,
    });
    return result.count;
  }

  async deleteMany(where: { bingoGameId?: string }): Promise<number> {
    const result = await this.db.song.deleteMany({
      where,
    });
    return result.count;
  }

  async delete(id: string): Promise<SongEntity> {
    const song = await this.db.song.delete({
      where: { id },
    });
    return this.toDomain(song);
  }

  private toDomain(prismaSong: PrismaSong): SongEntity {
    return {
      id: prismaSong.id,
      title: prismaSong.title,
      artist: prismaSong.artist,
      bingoGameId: prismaSong.bingoGameId,
      isPlayed: prismaSong.isPlayed,
      playedAt: prismaSong.playedAt,
    };
  }
}
