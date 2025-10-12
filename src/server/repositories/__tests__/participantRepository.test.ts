import { describe, it, expect, beforeEach, vi } from "vitest";
import { ParticipantRepository } from "../participantRepository";
import { createMockPrismaClient } from "~/test/mockPrisma";
import { type PrismaClient } from "@prisma/client";

describe("ParticipantRepository", () => {
  let mockPrisma: PrismaClient;
  let repository: ParticipantRepository;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new ParticipantRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should return a ParticipantEntity when participant exists", async () => {
      const mockParticipant = {
        id: "participant-1",
        name: "Test Player",
        sessionToken: "token-123",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: false,
        hasWon: false,
        wonAt: null,
      };

      vi.mocked(mockPrisma.participant.findUnique).mockResolvedValue(
        mockParticipant
      );

      const result = await repository.findById("participant-1");

      expect(result).toEqual(mockParticipant);
      expect(mockPrisma.participant.findUnique).toHaveBeenCalledWith({
        where: { id: "participant-1" },
      });
    });

    it("should return null when participant does not exist", async () => {
      vi.mocked(mockPrisma.participant.findUnique).mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findFirst", () => {
    it("should find first participant matching filter", async () => {
      const mockParticipant = {
        id: "participant-1",
        name: "Test Player",
        sessionToken: "token-123",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: true,
        hasWon: false,
        wonAt: null,
      };

      vi.mocked(mockPrisma.participant.findFirst).mockResolvedValue(
        mockParticipant
      );

      const result = await repository.findFirst({
        sessionToken: "token-123",
        bingoGameId: "game-1",
      });

      expect(result).toEqual(mockParticipant);
      expect(mockPrisma.participant.findFirst).toHaveBeenCalledWith({
        where: {
          sessionToken: "token-123",
          bingoGameId: "game-1",
        },
      });
    });

    it("should return null when no participant matches", async () => {
      vi.mocked(mockPrisma.participant.findFirst).mockResolvedValue(null);

      const result = await repository.findFirst({
        sessionToken: "non-existent",
      });

      expect(result).toBeNull();
    });
  });

  describe("findFirstWithSongs", () => {
    it("should return participant with songs", async () => {
      const mockParticipant = {
        id: "participant-1",
        name: "Test Player",
        sessionToken: "token-123",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: true,
        hasWon: false,
        wonAt: null,
        participantSongs: [
          {
            id: "ps-1",
            participantId: "participant-1",
            songId: "song-1",
            position: 0,
            song: {
              id: "song-1",
              title: "Song 1",
              artist: "Artist 1",
              bingoGameId: "game-1",
              isPlayed: true,
              playedAt: new Date(),
            },
          },
          {
            id: "ps-2",
            participantId: "participant-1",
            songId: "song-2",
            position: 1,
            song: {
              id: "song-2",
              title: "Song 2",
              artist: null,
              bingoGameId: "game-1",
              isPlayed: false,
              playedAt: null,
            },
          },
        ],
      };

      vi.mocked(mockPrisma.participant.findFirst).mockResolvedValue(
        mockParticipant
      );

      const result = await repository.findFirstWithSongs({
        sessionToken: "token-123",
      });

      expect(result).toBeDefined();
      expect(result?.participantSongs).toHaveLength(2);
      expect(result?.participantSongs[0]?.song.title).toBe("Song 1");
      expect(result?.participantSongs[1]?.song.artist).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should return participants matching filter", async () => {
      const mockParticipants = [
        {
          id: "participant-1",
          name: "Player 1",
          sessionToken: "token-1",
          bingoGameId: "game-1",
          createdAt: new Date(),
          isGridComplete: true,
          hasWon: false,
          wonAt: null,
        },
        {
          id: "participant-2",
          name: "Player 2",
          sessionToken: "token-2",
          bingoGameId: "game-1",
          createdAt: new Date(),
          isGridComplete: false,
          hasWon: false,
          wonAt: null,
        },
      ];

      vi.mocked(mockPrisma.participant.findMany).mockResolvedValue(
        mockParticipants
      );

      const result = await repository.findMany({ bingoGameId: "game-1" });

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("Player 1");
      expect(result[1]?.isGridComplete).toBe(false);
    });
  });

  describe("create", () => {
    it("should create a new participant", async () => {
      const mockCreatedParticipant = {
        id: "new-participant",
        name: "New Player",
        sessionToken: "new-token",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: false,
        hasWon: false,
        wonAt: null,
      };

      vi.mocked(mockPrisma.participant.create).mockResolvedValue(
        mockCreatedParticipant
      );

      const input = {
        name: "New Player",
        sessionToken: "new-token",
        bingoGameId: "game-1",
      };

      const result = await repository.create(input);

      expect(result).toEqual(mockCreatedParticipant);
      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });

  describe("update", () => {
    it("should update participant grid status", async () => {
      const mockUpdatedParticipant = {
        id: "participant-1",
        name: "Player",
        sessionToken: "token",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: true,
        hasWon: false,
        wonAt: null,
      };

      vi.mocked(mockPrisma.participant.update).mockResolvedValue(
        mockUpdatedParticipant
      );

      const result = await repository.update("participant-1", {
        isGridComplete: true,
      });

      expect(result.isGridComplete).toBe(true);
      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: "participant-1" },
        data: { isGridComplete: true },
      });
    });

    it("should update participant win status", async () => {
      const wonAt = new Date();
      const mockUpdatedParticipant = {
        id: "participant-1",
        name: "Winner",
        sessionToken: "token",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: true,
        hasWon: true,
        wonAt,
      };

      vi.mocked(mockPrisma.participant.update).mockResolvedValue(
        mockUpdatedParticipant
      );

      const result = await repository.update("participant-1", {
        hasWon: true,
        wonAt,
      });

      expect(result.hasWon).toBe(true);
      expect(result.wonAt).toEqual(wonAt);
    });
  });

  describe("updateMany", () => {
    it("should update multiple participants", async () => {
      vi.mocked(mockPrisma.participant.updateMany).mockResolvedValue({
        count: 3,
      });

      const result = await repository.updateMany(
        { bingoGameId: "game-1" },
        { hasWon: false, wonAt: null }
      );

      expect(result).toBe(3);
      expect(mockPrisma.participant.updateMany).toHaveBeenCalledWith({
        where: { bingoGameId: "game-1" },
        data: { hasWon: false, wonAt: null },
      });
    });
  });

  describe("deleteMany", () => {
    it("should delete multiple participants", async () => {
      vi.mocked(mockPrisma.participant.deleteMany).mockResolvedValue({
        count: 2,
      });

      const result = await repository.deleteMany({ bingoGameId: "game-1" });

      expect(result).toBe(2);
      expect(mockPrisma.participant.deleteMany).toHaveBeenCalledWith({
        where: { bingoGameId: "game-1" },
      });
    });
  });

  describe("delete", () => {
    it("should delete a participant", async () => {
      const mockDeletedParticipant = {
        id: "participant-1",
        name: "Deleted Player",
        sessionToken: "token",
        bingoGameId: "game-1",
        createdAt: new Date(),
        isGridComplete: false,
        hasWon: false,
        wonAt: null,
      };

      vi.mocked(mockPrisma.participant.delete).mockResolvedValue(
        mockDeletedParticipant
      );

      await repository.delete("participant-1");

      expect(mockPrisma.participant.delete).toHaveBeenCalledWith({
        where: { id: "participant-1" },
      });
    });
  });
});
