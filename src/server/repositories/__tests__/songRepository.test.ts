import { describe, it, expect, beforeEach, vi } from "vitest";
import { SongRepository } from "../songRepository";
import { createMockPrismaClient } from "~/test/mockPrisma";
import { type PrismaClient } from "@prisma/client";

describe("SongRepository", () => {
  let mockPrisma: PrismaClient;
  let repository: SongRepository;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new SongRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should return a SongEntity when song exists", async () => {
      const mockSong = {
        id: "song-1",
        title: "Test Song",
        artist: "Test Artist",
        bingoGameId: "game-1",
        isPlayed: false,
        playedAt: null,
      };

      vi.mocked(mockPrisma.song.findUnique).mockResolvedValue(mockSong);

      const result = await repository.findById("song-1");

      expect(result).toEqual(mockSong);
      expect(mockPrisma.song.findUnique).toHaveBeenCalledWith({
        where: { id: "song-1" },
      });
    });

    it("should return null when song does not exist", async () => {
      vi.mocked(mockPrisma.song.findUnique).mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should return songs matching the filter", async () => {
      const mockSongs = [
        {
          id: "song-1",
          title: "Song 1",
          artist: "Artist 1",
          bingoGameId: "game-1",
          isPlayed: false,
          playedAt: null,
        },
        {
          id: "song-2",
          title: "Song 2",
          artist: "Artist 2",
          bingoGameId: "game-1",
          isPlayed: true,
          playedAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.song.findMany).mockResolvedValue(mockSongs);

      const result = await repository.findMany({ bingoGameId: "game-1" });

      expect(result).toEqual(mockSongs);
      expect(mockPrisma.song.findMany).toHaveBeenCalledWith({
        where: { bingoGameId: "game-1" },
        orderBy: { title: "asc" },
      });
    });

    it("should return all songs when no filter is provided", async () => {
      const mockSongs = [
        {
          id: "song-1",
          title: "Song 1",
          artist: "Artist 1",
          bingoGameId: "game-1",
          isPlayed: false,
          playedAt: null,
        },
      ];

      vi.mocked(mockPrisma.song.findMany).mockResolvedValue(mockSongs);

      const result = await repository.findMany();

      expect(result).toEqual(mockSongs);
      expect(mockPrisma.song.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { title: "asc" },
      });
    });
  });

  describe("create", () => {
    it("should create a new song", async () => {
      const mockCreatedSong = {
        id: "new-song",
        title: "New Song",
        artist: "New Artist",
        bingoGameId: "game-1",
        isPlayed: false,
        playedAt: null,
      };

      vi.mocked(mockPrisma.song.create).mockResolvedValue(mockCreatedSong);

      const input = {
        title: "New Song",
        artist: "New Artist",
        bingoGameId: "game-1",
      };

      const result = await repository.create(input);

      expect(result).toEqual(mockCreatedSong);
      expect(mockPrisma.song.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it("should create a song without artist", async () => {
      const mockCreatedSong = {
        id: "new-song",
        title: "New Song",
        artist: null,
        bingoGameId: "game-1",
        isPlayed: false,
        playedAt: null,
      };

      vi.mocked(mockPrisma.song.create).mockResolvedValue(mockCreatedSong);

      const input = {
        title: "New Song",
        bingoGameId: "game-1",
      };

      const result = await repository.create(input);

      expect(result.artist).toBeNull();
    });
  });

  describe("createMany", () => {
    it("should create multiple songs", async () => {
      vi.mocked(mockPrisma.song.createMany).mockResolvedValue({ count: 3 });

      const inputs = [
        { title: "Song 1", artist: "Artist 1", bingoGameId: "game-1" },
        { title: "Song 2", artist: "Artist 2", bingoGameId: "game-1" },
        { title: "Song 3", artist: null, bingoGameId: "game-1" },
      ];

      const result = await repository.createMany(inputs);

      expect(result).toBe(3);
      expect(mockPrisma.song.createMany).toHaveBeenCalledWith({
        data: inputs,
      });
    });
  });

  describe("update", () => {
    it("should update a song", async () => {
      const mockUpdatedSong = {
        id: "song-1",
        title: "Updated Song",
        artist: "Updated Artist",
        bingoGameId: "game-1",
        isPlayed: true,
        playedAt: new Date(),
      };

      vi.mocked(mockPrisma.song.update).mockResolvedValue(mockUpdatedSong);

      const result = await repository.update("song-1", {
        title: "Updated Song",
        isPlayed: true,
        playedAt: mockUpdatedSong.playedAt,
      });

      expect(result).toEqual(mockUpdatedSong);
      expect(mockPrisma.song.update).toHaveBeenCalledWith({
        where: { id: "song-1" },
        data: {
          title: "Updated Song",
          isPlayed: true,
          playedAt: mockUpdatedSong.playedAt,
        },
      });
    });
  });

  describe("updateMany", () => {
    it("should update multiple songs matching the filter", async () => {
      vi.mocked(mockPrisma.song.updateMany).mockResolvedValue({ count: 5 });

      const result = await repository.updateMany(
        { bingoGameId: "game-1" },
        { isPlayed: false, playedAt: null }
      );

      expect(result).toBe(5);
      expect(mockPrisma.song.updateMany).toHaveBeenCalledWith({
        where: { bingoGameId: "game-1" },
        data: { isPlayed: false, playedAt: null },
      });
    });
  });

  describe("deleteMany", () => {
    it("should delete multiple songs matching the filter", async () => {
      vi.mocked(mockPrisma.song.deleteMany).mockResolvedValue({ count: 3 });

      const result = await repository.deleteMany({ bingoGameId: "game-1" });

      expect(result).toBe(3);
      expect(mockPrisma.song.deleteMany).toHaveBeenCalledWith({
        where: { bingoGameId: "game-1" },
      });
    });
  });

  describe("delete", () => {
    it("should delete a song", async () => {
      const mockDeletedSong = {
        id: "song-1",
        title: "Deleted Song",
        artist: "Artist",
        bingoGameId: "game-1",
        isPlayed: false,
        playedAt: null,
      };

      vi.mocked(mockPrisma.song.delete).mockResolvedValue(mockDeletedSong);

      await repository.delete("song-1");

      expect(mockPrisma.song.delete).toHaveBeenCalledWith({
        where: { id: "song-1" },
      });
    });
  });
});
