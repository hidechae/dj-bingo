import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  getGridSize,
  getRequiredSongCount,
  isValidStatusTransition,
} from "~/types";
import { BingoSize, GameStatus } from "~/domain/models";
import { BingoSizeValues, GameStatusValues } from "~/types";
import { type Repositories } from "~/server/repositories";

// Helper function to check if user is admin for a game
async function checkGameAdminPermission(
  repositories: Repositories,
  gameId: string,
  userId: string
): Promise<boolean> {
  const game = await repositories.bingoGame.findById(gameId);

  if (!game) return false;

  // User is admin if they're the creator
  if (game.createdBy === userId) return true;

  // Or explicitly added as admin
  const gameAdmins = await repositories.gameAdmin.findMany({
    bingoGameId: gameId,
    userId: userId,
  });

  return gameAdmins.length > 0;
}

// Procedure that requires admin permission for specific game
const gameAdminProcedure = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const hasPermission = await checkGameAdminPermission(
      ctx.repositories,
      input.gameId,
      ctx.session.user.id
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have admin permission for this game",
      });
    }

    return next({
      ctx,
    });
  });

export const bingoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        size: z.enum(BingoSizeValues),
        songs: z
          .array(
            z.object({
              title: z.string().min(1),
              artist: z.string().optional(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bingoGame = await ctx.repositories.bingoGame.create(
        {
          title: input.title,
          size: input.size as BingoSize,
          status: GameStatus.EDITING,
          createdBy: ctx.session.user.id,
        },
        input.songs.length > 0 ? input.songs : undefined
      );

      return bingoGame;
    }),

  duplicate: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permission for the source game
      const hasPermission = await checkGameAdminPermission(
        ctx.repositories,
        input.gameId,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to duplicate this game",
        });
      }

      // Get the original game with songs only
      const originalGame = await ctx.repositories.bingoGame.findByIdWithSongs(
        input.gameId
      );

      if (!originalGame) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Original game not found",
        });
      }

      // Create new game with copied songs only
      const duplicatedGame = await ctx.repositories.bingoGame.create(
        {
          title: `${originalGame.title} (コピー)`,
          size: originalGame.size,
          status: GameStatus.EDITING,
          createdBy: ctx.session.user.id,
        },
        originalGame.songs.map((song) => ({
          title: song.title,
          artist: song.artist ?? undefined,
        }))
      );

      return duplicatedGame;
    }),

  // Admin management procedures
  addAdmin: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        email: z.email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if current user has admin permission
      const hasPermission = await checkGameAdminPermission(
        ctx.repositories,
        input.gameId,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このゲームに管理者を追加する権限がありません",
        });
      }

      // Find user by email
      const targetUser = await ctx.repositories.user.findByEmail(input.email);

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "このメールアドレスのユーザーはまだDJ Bingoにサインアップしていません。先にGoogle認証でサインインしてもらう必要があります。",
        });
      }

      // Check if game exists
      const game = await ctx.repositories.bingoGame.findById(input.gameId);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ゲームが見つかりません",
        });
      }

      // Check if user is already the creator
      if (game.createdBy === targetUser.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このユーザーは既にゲームの作成者です",
        });
      }

      // Check if user is already an admin
      const existingAdmins = await ctx.repositories.gameAdmin.findMany({
        bingoGameId: input.gameId,
        userId: targetUser.id,
      });

      if (existingAdmins.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このユーザーは既に管理者として追加されています",
        });
      }

      // Add user as admin
      const gameAdmin = await ctx.repositories.gameAdmin.create({
        bingoGameId: input.gameId,
        userId: targetUser.id,
        addedBy: ctx.session.user.id,
      });

      // Fetch with user details to return
      const gameAdminWithUser =
        await ctx.repositories.gameAdmin.findByIdWithUser(gameAdmin.id);

      return gameAdminWithUser;
    }),

  removeAdmin: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        adminId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if current user has admin permission
      const hasPermission = await checkGameAdminPermission(
        ctx.repositories,
        input.gameId,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove admins from this game",
        });
      }

      // Find and delete the admin record
      const gameAdmin = await ctx.repositories.gameAdmin.findById(
        input.adminId
      );

      if (!gameAdmin || gameAdmin.bingoGameId !== input.gameId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin record not found",
        });
      }

      await ctx.repositories.gameAdmin.delete(input.adminId);

      return { success: true };
    }),

  getGameAdmins: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if current user has admin permission
      const hasPermission = await checkGameAdminPermission(
        ctx.repositories,
        input.gameId,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view admins for this game",
        });
      }

      const game = await ctx.repositories.bingoGame.findByIdWithAdmins(
        input.gameId
      );

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return {
        creator: game.user,
        admins: game.gameAdmins,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bingoGame = await ctx.repositories.bingoGame.findByIdWithDetails(
        input.id
      );

      return bingoGame;
    }),

  getAllByUser: protectedProcedure.query(async ({ ctx }) => {
    const bingoGames = await ctx.repositories.bingoGame.findManyByUser(
      ctx.session.user.id
    );

    return bingoGames;
  }),

  updateSongs: gameAdminProcedure
    .input(
      z.object({
        gameId: z.string(),
        songs: z.array(
          z.object({
            id: z.string().optional(), // For existing songs
            title: z.string().min(1),
            artist: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if game is in editing status
      const game = await ctx.repositories.bingoGame.findByIdWithSongs(
        input.gameId
      );

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (game.status !== GameStatus.EDITING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Songs can only be edited in EDITING status",
        });
      }

      // Delete all existing songs and create new ones
      await ctx.repositories.song.deleteMany({
        bingoGameId: input.gameId,
      });

      if (input.songs.length > 0) {
        await ctx.repositories.song.createMany(
          input.songs.map((song) => ({
            title: song.title,
            artist: song.artist ?? null,
            bingoGameId: input.gameId,
          }))
        );
      }

      return await ctx.repositories.bingoGame.findByIdWithSongs(input.gameId);
    }),

  updateTitle: gameAdminProcedure
    .input(
      z.object({
        gameId: z.string(),
        title: z.string().min(1, "Title cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update the game title
      const updatedGame = await ctx.repositories.bingoGame.update(
        input.gameId,
        { title: input.title }
      );

      return updatedGame;
    }),

  changeStatus: gameAdminProcedure
    .input(
      z.object({
        gameId: z.string(),
        newStatus: z.enum(GameStatusValues),
        options: z
          .object({
            preservePlayedSongs: z.boolean().optional(),
            preserveParticipants: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.repositories.bingoGame.findByIdWithSongs(
        input.gameId
      );

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const currentStatus = game.status;
      const newStatus = input.newStatus as GameStatus;

      // Validate status transition is allowed
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}`
        );
      }

      // Validate minimum song requirement when transitioning to ENTRY
      if (newStatus === GameStatus.ENTRY) {
        const requiredSongs = getRequiredSongCount(game.size);
        if (game.songs.length < requiredSongs) {
          throw new Error(
            `最低${requiredSongs}曲必要です。現在${game.songs.length}曲です。`
          );
        }
      }

      // Validate status transitions and handle data changes
      const { preservePlayedSongs = true, preserveParticipants = true } =
        input.options || {};

      // Handle status-specific logic
      if (
        newStatus === GameStatus.EDITING &&
        currentStatus === GameStatus.ENTRY
      ) {
        // Transition from ENTRY to EDITING - optionally clear participants
        if (!preserveParticipants) {
          await ctx.repositories.participant.deleteMany({
            bingoGameId: input.gameId,
          });
        }
      } else if (
        newStatus === GameStatus.ENTRY &&
        currentStatus === GameStatus.PLAYING
      ) {
        // Transition from PLAYING to ENTRY - optionally reset played songs
        if (!preservePlayedSongs) {
          await ctx.repositories.song.updateMany(
            { bingoGameId: input.gameId },
            {
              isPlayed: false,
              playedAt: null,
            }
          );

          // Reset all participant win states
          await ctx.repositories.participant.updateMany(
            { bingoGameId: input.gameId },
            {
              hasWon: false,
              wonAt: null,
            }
          );
        }
      }

      // Update game status
      const updatedGame = await ctx.repositories.bingoGame.update(
        input.gameId,
        { status: newStatus }
      );

      return updatedGame;
    }),

  getIncompleteGridParticipants: gameAdminProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.repositories.participant.findMany({
        bingoGameId: input.gameId,
      });

      // Filter for incomplete grids
      const incompleteParticipants = participants
        .filter((p) => !p.isGridComplete)
        .map((p) => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
        }));

      return incompleteParticipants;
    }),

  markSongAsPlayed: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
        isPlayed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get song details first
      const song = await ctx.repositories.song.findById(input.songId);

      if (!song) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Song not found",
        });
      }

      // Get the game to check status
      const game = await ctx.repositories.bingoGame.findById(song.bingoGameId);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // Check if user has admin permission for this game
      const hasPermission = await checkGameAdminPermission(
        ctx.repositories,
        game.id,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this game",
        });
      }

      if (game.status !== GameStatus.PLAYING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Songs can only be marked as played in PLAYING status",
        });
      }

      const updatedSong = await ctx.repositories.song.update(input.songId, {
        isPlayed: input.isPlayed,
        playedAt: input.isPlayed ? new Date() : null,
      });

      // Check for winners/losers after marking a song as played or unplayed
      await checkForWinners(ctx.repositories, song.bingoGameId);

      return updatedSong;
    }),

  getParticipants: gameAdminProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.repositories.participant.findManyWithSongs(
        {
          bingoGameId: input.gameId,
        }
      );

      return participants;
    }),
});

async function checkForWinners(
  repositories: Repositories,
  bingoGameId: string
) {
  const bingoGame = await repositories.bingoGame.findById(bingoGameId);

  if (!bingoGame) return;

  const participants = await repositories.participant.findManyWithSongs({
    bingoGameId,
  });

  const gridSize = getGridSize(bingoGame.size);

  for (const participant of participants) {
    if (!participant.isGridComplete) continue;

    const grid = Array(gridSize * gridSize).fill(null);

    // Fill the grid with played status
    participant.participantSongs.forEach((ps) => {
      grid[ps.position] = ps.song.isPlayed;
    });

    const currentlyHasWon = hasWon(grid, gridSize);

    // Update win status if it has changed
    if (currentlyHasWon && !participant.hasWon) {
      // Participant just won
      await repositories.participant.update(participant.id, {
        hasWon: true,
        wonAt: new Date(),
      });
    } else if (!currentlyHasWon && participant.hasWon) {
      // Participant lost their win (song was unmarked)
      await repositories.participant.update(participant.id, {
        hasWon: false,
        wonAt: null,
      });
    }
  }
}

function hasWon(grid: boolean[], size: number): boolean {
  // Check rows
  for (let i = 0; i < size; i++) {
    let rowWin = true;
    for (let j = 0; j < size; j++) {
      if (!grid[i * size + j]) {
        rowWin = false;
        break;
      }
    }
    if (rowWin) return true;
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    let colWin = true;
    for (let i = 0; i < size; i++) {
      if (!grid[i * size + j]) {
        colWin = false;
        break;
      }
    }
    if (colWin) return true;
  }

  // Check diagonals
  let diagWin1 = true;
  let diagWin2 = true;
  for (let i = 0; i < size; i++) {
    if (!grid[i * size + i]) diagWin1 = false;
    if (!grid[i * size + (size - 1 - i)]) diagWin2 = false;
  }

  return diagWin1 || diagWin2;
}
