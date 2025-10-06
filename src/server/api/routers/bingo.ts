import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { 
  BingoSize, 
  GameStatus, 
  getGridSize, 
  getRequiredSongCount,
  isValidStatusTransition 
} from "~/types";

export const bingoRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        size: z.nativeEnum(BingoSize),
        songs: z.array(
          z.object({
            title: z.string().min(1),
            artist: z.string().optional(),
          })
        ).optional().default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bingoGame = await ctx.db.bingoGame.create({
        data: {
          title: input.title,
          size: input.size,
          status: GameStatus.EDITING,
          createdBy: ctx.session.user.id,
          ...(input.songs && input.songs.length > 0 && {
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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bingoGame = await ctx.db.bingoGame.findUnique({
        where: { id: input.id },
        include: {
          songs: {
            orderBy: [
              { artist: "asc" },
              { title: "asc" }
            ]
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

  getAllByUser: protectedProcedure
    .query(async ({ ctx }) => {
      const bingoGames = await ctx.db.bingoGame.findMany({
        where: { createdBy: ctx.session.user.id },
        include: {
          songs: {
            orderBy: [
              { artist: "asc" },
              { title: "asc" }
            ]
          },
          participants: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return bingoGames;
    }),

  updateSongs: protectedProcedure
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
        include: { songs: true }
      });

      if (!game) {
        throw new Error("Game not found");
      }

      if (game.status !== GameStatus.EDITING) {
        throw new Error("Songs can only be edited in EDITING status");
      }

      // Delete all existing songs and create new ones
      await ctx.db.song.deleteMany({
        where: { bingoGameId: input.gameId }
      });

      if (input.songs.length > 0) {
        await ctx.db.song.createMany({
          data: input.songs.map(song => ({
            title: song.title,
            artist: song.artist,
            bingoGameId: input.gameId
          }))
        });
      }

      return await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: { songs: true, participants: true }
      });
    }),

  changeStatus: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        newStatus: z.nativeEnum(GameStatus),
        options: z.object({
          preservePlayedSongs: z.boolean().optional(),
          preserveParticipants: z.boolean().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.bingoGame.findUnique({
        where: { id: input.gameId },
        include: {
          songs: true,
          participants: {
            include: {
              participantSongs: true
            }
          }
        }
      });

      if (!game) {
        throw new Error("Game not found");
      }

      const currentStatus = game.status as GameStatus;
      
      // Validate status transition is allowed
      if (!isValidStatusTransition(currentStatus, input.newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${input.newStatus}`);
      }

      // Validate minimum song requirement when transitioning to ENTRY
      if (input.newStatus === GameStatus.ENTRY) {
        const requiredSongs = getRequiredSongCount(game.size as BingoSize);
        if (game.songs.length < requiredSongs) {
          throw new Error(`最低${requiredSongs}曲必要です。現在${game.songs.length}曲です。`);
        }
      }

      // Validate status transitions and handle data changes
      const { preservePlayedSongs = true, preserveParticipants = true } = input.options || {};
      
      // Handle status-specific logic
      if (input.newStatus === GameStatus.ENTRY && currentStatus === GameStatus.EDITING) {
        // Transition from EDITING to ENTRY - optionally clear participants
        if (!preserveParticipants) {
          await ctx.db.participant.deleteMany({
            where: { bingoGameId: input.gameId }
          });
        }
      } else if (input.newStatus === GameStatus.ENTRY && currentStatus === GameStatus.PLAYING) {
        // Transition from PLAYING to ENTRY - optionally reset played songs
        if (!preservePlayedSongs) {
          await ctx.db.song.updateMany({
            where: { bingoGameId: input.gameId },
            data: {
              isPlayed: false,
              playedAt: null,
            }
          });
          
          // Reset all participant win states
          await ctx.db.participant.updateMany({
            where: { bingoGameId: input.gameId },
            data: {
              hasWon: false,
              wonAt: null,
            }
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

  getIncompleteGridParticipants: protectedProcedure
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
        }
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
        include: { bingoGame: true }
      });

      if (!song) {
        throw new Error("Song not found");
      }

      if (song.bingoGame.status !== GameStatus.PLAYING) {
        throw new Error("Songs can only be marked as played in PLAYING status");
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

  getParticipants: protectedProcedure
    .input(z.object({ bingoGameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.participant.findMany({
        where: { bingoGameId: input.bingoGameId },
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

async function checkForWinners(db: any, bingoGameId: string) {
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

  const gridSize = getGridSize(bingoGame.size);
  
  for (const participant of bingoGame.participants) {
    if (!participant.isGridComplete) continue;

    const grid = Array(gridSize * gridSize).fill(null);
    
    // Fill the grid with played status
    participant.participantSongs.forEach((ps: any) => {
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