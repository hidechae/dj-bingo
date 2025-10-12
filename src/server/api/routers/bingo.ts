import { z } from "zod";
import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  BingoSize,
  BingoSizeValues,
  GameStatus,
  GameStatusValues,
  getGridSize,
  getRequiredSongCount,
  isValidStatusTransition,
} from "~/types";

// Helper function to check if user is admin for a game
async function checkGameAdminPermission(
  db: PrismaClient,
  gameId: string,
  userId: string
): Promise<boolean> {
  const game = await db.bingoGame.findUnique({
    where: { id: gameId },
    include: {
      gameAdmins: {
        where: { userId: userId },
      },
    },
  });

  if (!game) return false;

  // User is admin if they're the creator or explicitly added as admin
  return game.createdBy === userId || game.gameAdmins.length > 0;
}

// Procedure that requires admin permission for specific game
const gameAdminProcedure = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const hasPermission = await checkGameAdminPermission(
      ctx.db,
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
      const bingoGame = await ctx.db.bingoGame.create({
        data: {
          title: input.title,
          size: input.size,
          status: GameStatus.EDITING,
          createdBy: ctx.session.user.id,
          ...(input.songs &&
            input.songs.length > 0 && {
              songs: {
                create: input.songs,
              },
            }),
        },
        include: {
          songs: true,
          participants: true,
        },
      });

      return bingoGame;
    }),

  duplicate: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permission for the source game
      const hasPermission = await checkGameAdminPermission(
        ctx.db,
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
      const originalGame = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: {
          songs: {
            select: {
              title: true,
              artist: true,
            },
          },
        },
      });

      if (!originalGame) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Original game not found",
        });
      }

      // Create new game with copied songs only
      const duplicatedGame = await ctx.db.bingoGame.create({
        data: {
          title: `${originalGame.title} (コピー)`,
          size: originalGame.size,
          status: GameStatus.EDITING,
          createdBy: ctx.session.user.id,
          songs: {
            create: originalGame.songs.map((song) => ({
              title: song.title,
              artist: song.artist,
            })),
          },
        },
        include: {
          songs: true,
          participants: true,
        },
      });

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
        ctx.db,
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
      const targetUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "このメールアドレスのユーザーはまだDJ Bingoにサインアップしていません。先にGoogle認証でサインインしてもらう必要があります。",
        });
      }

      // Check if user is already an admin
      const game = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: {
          gameAdmins: {
            where: { userId: targetUser.id },
          },
        },
      });

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
      if (game.gameAdmins.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このユーザーは既に管理者として追加されています",
        });
      }

      // Add user as admin
      const gameAdmin = await ctx.db.gameAdmin.create({
        data: {
          bingoGameId: input.gameId,
          userId: targetUser.id,
          addedBy: ctx.session.user.id,
        },
        include: {
          user: true,
        },
      });

      return gameAdmin;
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
        ctx.db,
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
      const gameAdmin = await ctx.db.gameAdmin.findUnique({
        where: { id: input.adminId },
        include: {
          bingoGame: true,
        },
      });

      if (!gameAdmin || gameAdmin.bingoGameId !== input.gameId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin record not found",
        });
      }

      await ctx.db.gameAdmin.delete({
        where: { id: input.adminId },
      });

      return { success: true };
    }),

  getGameAdmins: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if current user has admin permission
      const hasPermission = await checkGameAdminPermission(
        ctx.db,
        input.gameId,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view admins for this game",
        });
      }

      const game = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: {
          user: true, // Creator
          gameAdmins: {
            include: {
              user: true,
            },
            orderBy: { addedAt: "asc" },
          },
        },
      });

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
      const bingoGame = await ctx.db.bingoGame.findUnique({
        where: { id: input.id },
        include: {
          songs: {
            orderBy: [{ artist: "asc" }, { title: "asc" }],
          },
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

      return bingoGame;
    }),

  getAllByUser: protectedProcedure.query(async ({ ctx }) => {
    const bingoGames = await ctx.db.bingoGame.findMany({
      where: {
        OR: [
          { createdBy: ctx.session.user.id },
          {
            gameAdmins: {
              some: { userId: ctx.session.user.id },
            },
          },
        ],
      },
      include: {
        songs: {
          orderBy: [{ artist: "asc" }, { title: "asc" }],
        },
        participants: true,
        user: true, // Include creator info
        gameAdmins: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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
      const game = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: { songs: true },
      });

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
      await ctx.db.song.deleteMany({
        where: { bingoGameId: input.gameId },
      });

      if (input.songs.length > 0) {
        await ctx.db.song.createMany({
          data: input.songs.map((song) => ({
            title: song.title,
            artist: song.artist,
            bingoGameId: input.gameId,
          })),
        });
      }

      return await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: { songs: true, participants: true },
      });
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
      const updatedGame = await ctx.db.bingoGame.update({
        where: { id: input.gameId },
        data: { title: input.title },
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
      const game = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: {
          songs: true,
          participants: {
            include: {
              participantSongs: true,
            },
          },
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const currentStatus = game.status as GameStatus;

      // Validate status transition is allowed
      if (!isValidStatusTransition(currentStatus, input.newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${input.newStatus}`
        );
      }

      // Validate minimum song requirement when transitioning to ENTRY
      if (input.newStatus === GameStatus.ENTRY) {
        const requiredSongs = getRequiredSongCount(game.size as BingoSize);
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
        input.newStatus === GameStatus.EDITING &&
        currentStatus === GameStatus.ENTRY
      ) {
        // Transition from ENTRY to EDITING - optionally clear participants
        if (!preserveParticipants) {
          await ctx.db.participant.deleteMany({
            where: { bingoGameId: input.gameId },
          });
        }
      } else if (
        input.newStatus === GameStatus.ENTRY &&
        currentStatus === GameStatus.PLAYING
      ) {
        // Transition from PLAYING to ENTRY - optionally reset played songs
        if (!preservePlayedSongs) {
          await ctx.db.song.updateMany({
            where: { bingoGameId: input.gameId },
            data: {
              isPlayed: false,
              playedAt: null,
            },
          });

          // Reset all participant win states
          await ctx.db.participant.updateMany({
            where: { bingoGameId: input.gameId },
            data: {
              hasWon: false,
              wonAt: null,
            },
          });
        }
      }

      // Update game status
      const updatedGame = await ctx.db.bingoGame.update({
        where: { id: input.gameId },
        data: { status: input.newStatus },
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

      return updatedGame;
    }),

  getIncompleteGridParticipants: gameAdminProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.participant.findMany({
        where: {
          bingoGameId: input.gameId,
          isGridComplete: false,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      return participants;
    }),

  markSongAsPlayed: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
        isPlayed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if game is in PLAYING status
      const song = await ctx.db.song.findUnique({
        where: { id: input.songId },
        include: { bingoGame: true },
      });

      if (!song) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Song not found",
        });
      }

      // Check if user has admin permission for this game
      const hasPermission = await checkGameAdminPermission(
        ctx.db,
        song.bingoGame.id,
        ctx.session.user.id
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this game",
        });
      }

      if (song.bingoGame.status !== GameStatus.PLAYING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Songs can only be marked as played in PLAYING status",
        });
      }

      const updatedSong = await ctx.db.song.update({
        where: { id: input.songId },
        data: {
          isPlayed: input.isPlayed,
          playedAt: input.isPlayed ? new Date() : null,
        },
        include: {
          bingoGame: true,
        },
      });

      // Check for winners/losers after marking a song as played or unplayed
      await checkForWinners(ctx.db, updatedSong.bingoGameId);

      return updatedSong;
    }),

  getParticipants: gameAdminProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.participant.findMany({
        where: { bingoGameId: input.gameId },
        include: {
          participantSongs: {
            include: {
              song: true,
            },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return participants;
    }),
});

async function checkForWinners(db: PrismaClient, bingoGameId: string) {
  const bingoGame = await db.bingoGame.findUnique({
    where: { id: bingoGameId },
    include: {
      participants: {
        include: {
          participantSongs: {
            include: {
              song: true,
            },
          },
        },
      },
    },
  });

  if (!bingoGame) return;

  const gridSize = getGridSize(bingoGame.size as BingoSize);

  for (const participant of bingoGame.participants) {
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
      await db.participant.update({
        where: { id: participant.id },
        data: {
          hasWon: true,
          wonAt: new Date(),
        },
      });
    } else if (!currentlyHasWon && participant.hasWon) {
      // Participant lost their win (song was unmarked)
      await db.participant.update({
        where: { id: participant.id },
        data: {
          hasWon: false,
          wonAt: null,
        },
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
