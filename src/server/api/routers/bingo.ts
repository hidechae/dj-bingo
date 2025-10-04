import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { BingoSize } from "@prisma/client";

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
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bingoGame = await ctx.db.bingoGame.create({
        data: {
          title: input.title,
          size: input.size,
          createdBy: ctx.session.user.id,
          songs: {
            create: input.songs,
          },
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

      return bingoGame;
    }),

  getAllByUser: protectedProcedure
    .query(async ({ ctx }) => {
      const bingoGames = await ctx.db.bingoGame.findMany({
        where: { createdBy: ctx.session.user.id },
        include: {
          songs: true,
          participants: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return bingoGames;
    }),

  markSongAsPlayed: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
        isPlayed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const song = await ctx.db.song.update({
        where: { id: input.songId },
        data: {
          isPlayed: input.isPlayed,
          playedAt: input.isPlayed ? new Date() : null,
        },
        include: {
          bingoGame: true,
        },
      });

      // Check for winners after marking a song as played
      if (input.isPlayed) {
        await checkForWinners(ctx.db, song.bingoGameId);
      }

      return song;
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
    if (participant.hasWon || !participant.isGridComplete) continue;

    const grid = Array(gridSize * gridSize).fill(null);
    
    // Fill the grid with played status
    participant.participantSongs.forEach((ps) => {
      grid[ps.position] = ps.song.isPlayed;
    });

    if (hasWon(grid, gridSize)) {
      await db.participant.update({
        where: { id: participant.id },
        data: {
          hasWon: true,
          wonAt: new Date(),
        },
      });
    }
  }
}

function getGridSize(size: BingoSize): number {
  switch (size) {
    case BingoSize.THREE_BY_THREE:
      return 3;
    case BingoSize.FOUR_BY_FOUR:
      return 4;
    case BingoSize.FIVE_BY_FIVE:
      return 5;
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