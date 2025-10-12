import { describe, it, expect, beforeEach, vi } from "vitest";
import { BingoGameRepository } from "~/server/repositories";
import { createMockPrismaClient } from "~/test/mockPrisma";
import { BingoSize, GameStatus } from "~/domain/models";
import { type PrismaClient, type BingoGame, Prisma } from "@prisma/client";

describe("BingoGameRepository", () => {
  let mockPrisma: PrismaClient;
  let repository: BingoGameRepository;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new BingoGameRepository(mockPrisma);
  });

  describe("findById", () => {
    it("should return a BingoGameEntity when game exists", async () => {
      const mockGame: BingoGame = {
        id: "game-1",
        title: "Test Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
      };

      vi.mocked(mockPrisma.bingoGame.findUnique).mockResolvedValue(mockGame);

      const result = await repository.findById("game-1");

      expect(result).toEqual({
        id: "game-1",
        title: "Test Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdAt: mockGame.createdAt,
        updatedAt: mockGame.updatedAt,
        createdBy: "user-1",
        isActive: true,
      });

      expect(mockPrisma.bingoGame.findUnique).toHaveBeenCalledWith({
        where: { id: "game-1" },
      });
    });

    it("should return null when game does not exist", async () => {
      vi.mocked(mockPrisma.bingoGame.findUnique).mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByIdWithSongs", () => {
    it("should return BingoGameWithSongs when game exists", async () => {
      const mockGame: Prisma.BingoGameGetPayload<{ include: { songs: true } }> =
        {
          id: "game-1",
          title: "Test Game",
          size: BingoSize.THREE_BY_THREE,
          status: GameStatus.EDITING,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "user-1",
          isActive: true,
          songs: [
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
              artist: null,
              bingoGameId: "game-1",
              isPlayed: true,
              playedAt: new Date(),
            },
          ],
        };

      vi.mocked(mockPrisma.bingoGame.findUnique).mockResolvedValue(mockGame);

      const result = await repository.findByIdWithSongs("game-1");

      expect(result).toBeDefined();
      expect(result?.songs).toHaveLength(2);
      expect(result?.songs[0]).toEqual({
        id: "song-1",
        title: "Song 1",
        artist: "Artist 1",
        bingoGameId: "game-1",
        isPlayed: false,
        playedAt: null,
      });
    });

    it("should return null when game does not exist", async () => {
      vi.mocked(mockPrisma.bingoGame.findUnique).mockResolvedValue(null);

      const result = await repository.findByIdWithSongs("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByIdWithDetails", () => {
    it("should return BingoGameWithDetails including participants and user", async () => {
      const mockGame: Prisma.BingoGameGetPayload<{
        include: {
          songs: true;
          participants: {
            include: { participantSongs: { include: { song: true } } };
          };
          user: true;
        };
      }> = {
        id: "game-1",
        title: "Test Game",
        size: BingoSize.FIVE_BY_FIVE,
        status: GameStatus.PLAYING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
        songs: [
          {
            id: "song-1",
            title: "Song 1",
            artist: "Artist 1",
            bingoGameId: "game-1",
            isPlayed: true,
            playedAt: new Date(),
          },
        ],
        participants: [
          {
            id: "participant-1",
            name: "Player 1",
            sessionToken: "token-1",
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
            ],
          },
        ],
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: new Date(),
          image: "https://example.com/image.jpg",
          password: null,
        },
      };

      vi.mocked(mockPrisma.bingoGame.findUnique).mockResolvedValue(mockGame);

      const result = await repository.findByIdWithDetails("game-1");

      expect(result).toBeDefined();
      expect(result?.songs).toHaveLength(1);
      expect(result?.participants).toHaveLength(1);
      expect(result?.participants[0]?.participantSongs).toHaveLength(1);
      expect(result?.user).toEqual({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: mockGame.user.emailVerified,
        image: "https://example.com/image.jpg",
        // password field is not included for security reasons
      });
    });
  });

  describe("create", () => {
    it("should create a new bingo game without songs", async () => {
      const mockCreatedGame: Prisma.BingoGameGetPayload<{
        include: { songs: true; participants: true };
      }> = {
        id: "new-game",
        title: "New Game",
        size: BingoSize.FOUR_BY_FOUR,
        status: GameStatus.EDITING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
        songs: [],
        participants: [],
      };

      vi.mocked(mockPrisma.bingoGame.create).mockResolvedValue(mockCreatedGame);

      const input = {
        title: "New Game",
        size: BingoSize.FOUR_BY_FOUR,
        status: GameStatus.EDITING,
        createdBy: "user-1",
      };

      const result = await repository.create(input);

      expect(result).toBeDefined();
      expect(result.title).toBe("New Game");
      expect(result.size).toBe(BingoSize.FOUR_BY_FOUR);
      expect(result.songs).toEqual([]);
      expect(result.participants).toEqual([]);

      expect(mockPrisma.bingoGame.create).toHaveBeenCalledWith({
        data: {
          title: "New Game",
          size: "FOUR_BY_FOUR",
          status: "EDITING",
          createdBy: "user-1",
        },
        include: {
          songs: true,
          participants: true,
        },
      });
    });

    it("should create a new bingo game with songs", async () => {
      const mockCreatedGame: Prisma.BingoGameGetPayload<{
        include: { songs: true; participants: true };
      }> = {
        id: "new-game",
        title: "New Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
        songs: [
          {
            id: "song-1",
            title: "Song 1",
            artist: "Artist 1",
            bingoGameId: "new-game",
            isPlayed: false,
            playedAt: null,
          },
        ],
        participants: [],
      };

      vi.mocked(mockPrisma.bingoGame.create).mockResolvedValue(mockCreatedGame);

      const input = {
        title: "New Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdBy: "user-1",
      };

      const songs = [{ title: "Song 1", artist: "Artist 1" }];

      const result = await repository.create(input, songs);

      expect(result.songs).toHaveLength(1);
      expect(result.songs[0]?.title).toBe("Song 1");
    });
  });

  describe("update", () => {
    it("should update a bingo game title", async () => {
      const mockUpdatedGame: Prisma.BingoGameGetPayload<{
        include: {
          songs: true;
          participants: {
            include: { participantSongs: { include: { song: true } } };
          };
          user: true;
        };
      }> = {
        id: "game-1",
        title: "Updated Title",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
        songs: [],
        participants: [],
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: null,
          image: null,
          password: null,
        },
      };

      vi.mocked(mockPrisma.bingoGame.update).mockResolvedValue(mockUpdatedGame);

      const result = await repository.update("game-1", {
        title: "Updated Title",
      });

      expect(result.title).toBe("Updated Title");

      expect(mockPrisma.bingoGame.update).toHaveBeenCalledWith({
        where: { id: "game-1" },
        data: { title: "Updated Title" },
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
    });

    it("should update a bingo game status", async () => {
      const mockUpdatedGame: Prisma.BingoGameGetPayload<{
        include: {
          songs: true;
          participants: {
            include: { participantSongs: { include: { song: true } } };
          };
          user: true;
        };
      }> = {
        id: "game-1",
        title: "Test Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.ENTRY,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
        songs: [],
        participants: [],
        user: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: null,
          image: null,
          password: null,
        },
      };

      vi.mocked(mockPrisma.bingoGame.update).mockResolvedValue(mockUpdatedGame);

      const result = await repository.update("game-1", {
        status: GameStatus.ENTRY,
      });

      expect(result.status).toBe(GameStatus.ENTRY);
    });
  });

  describe("delete", () => {
    it("should delete a bingo game", async () => {
      const mockDeletedGame: BingoGame = {
        id: "game-1",
        title: "Deleted Game",
        size: BingoSize.THREE_BY_THREE,
        status: GameStatus.EDITING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
        isActive: true,
      };

      vi.mocked(mockPrisma.bingoGame.delete).mockResolvedValue(mockDeletedGame);

      await repository.delete("game-1");

      expect(mockPrisma.bingoGame.delete).toHaveBeenCalledWith({
        where: { id: "game-1" },
      });
    });
  });

  describe("findManyByUser", () => {
    it("should return games created by or administered by the user", async () => {
      const mockGames: Prisma.BingoGameGetPayload<{
        include: {
          songs: true;
          participants: true;
          user: true;
          gameAdmins: { include: { user: true } };
        };
      }>[] = [
        {
          id: "game-1",
          title: "Game 1",
          size: BingoSize.THREE_BY_THREE,
          status: GameStatus.EDITING,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
          createdBy: "user-1",
          isActive: true,
          songs: [],
          participants: [],
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            emailVerified: null,
            image: null,
            password: null,
          },
          gameAdmins: [],
        },
        {
          id: "game-2",
          title: "Game 2",
          size: BingoSize.FIVE_BY_FIVE,
          status: GameStatus.PLAYING,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date(),
          createdBy: "user-2",
          isActive: true,
          songs: [],
          participants: [],
          user: {
            id: "user-2",
            name: "Other User",
            email: "other@example.com",
            emailVerified: null,
            image: null,
            password: null,
          },
          gameAdmins: [
            {
              id: "ga-1",
              bingoGameId: "game-2",
              userId: "user-1",
              addedBy: "user-2",
              addedAt: new Date(),
              user: {
                id: "user-1",
                name: "Test User",
                email: "test@example.com",
                emailVerified: null,
                image: null,
                password: null,
              },
            },
          ],
        },
      ];

      vi.mocked(mockPrisma.bingoGame.findMany).mockResolvedValue(mockGames);

      const result = await repository.findManyByUser("user-1");

      expect(result).toHaveLength(2);
      expect(result[0]?.title).toBe("Game 1");
      expect(result[1]?.gameAdmins).toHaveLength(1);

      expect(mockPrisma.bingoGame.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdBy: "user-1" },
            {
              gameAdmins: {
                some: { userId: "user-1" },
              },
            },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });
  });
});
