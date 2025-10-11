import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { GameStatus, BingoSize, getGridSize } from "~/types";

export const participantRouter = createTRPCRouter({
  join: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bingoGameId: z.string(),
        sessionToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if bingo game exists and is active
      const bingoGame = await ctx.db.bingoGame.findUnique({
        where: { id: input.bingoGameId },
        include: {
          songs: {
            orderBy: [{ artist: "asc" }, { title: "asc" }],
          },
        },
      });

      if (!bingoGame || !bingoGame.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bingo game not found or inactive",
        });
      }

      // Check if game is in ENTRY status (participants can only join during ENTRY)
      if (bingoGame.status !== GameStatus.ENTRY) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Participants can only join during ENTRY status",
        });
      }

      // Check if participant already exists with this session token for this specific game
      const existingParticipant = await ctx.db.participant.findUnique({
        where: { 
          sessionToken_bingoGameId: {
            sessionToken: input.sessionToken,
            bingoGameId: input.bingoGameId,
          }
        },
      });

      if (existingParticipant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already joined this game",
        });
      }

      const participant = await ctx.db.participant.create({
        data: {
          name: input.name,
          bingoGameId: input.bingoGameId,
          sessionToken: input.sessionToken,
        },
        include: {
          bingoGame: {
            include: {
              songs: true,
            },
          },
        },
      });

      return participant;
    }),

  getBySessionToken: publicProcedure
    .input(z.object({ 
      sessionToken: z.string(),
      bingoGameId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // If bingoGameId is provided, find participant for specific game
      if (input.bingoGameId) {
        const participant = await ctx.db.participant.findUnique({
          where: { 
            sessionToken_bingoGameId: {
              sessionToken: input.sessionToken,
              bingoGameId: input.bingoGameId,
            }
          },
          include: {
            bingoGame: {
              include: {
                songs: {
                  orderBy: [{ artist: "asc" }, { title: "asc" }],
                },
              },
            },
            participantSongs: {
              include: {
                song: true,
              },
              orderBy: { position: "asc" },
            },
          },
        });
        return participant;
      }

      // If no bingoGameId provided, return first participant found (backward compatibility)
      const participant = await ctx.db.participant.findFirst({
        where: { sessionToken: input.sessionToken },
        include: {
          bingoGame: {
            include: {
              songs: {
                orderBy: [{ artist: "asc" }, { title: "asc" }],
              },
            },
          },
          participantSongs: {
            include: {
              song: true,
            },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { createdAt: "desc" }, // Get most recent participation
      });

      return participant;
    }),

  assignSongs: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        songAssignments: z.array(
          z.object({
            songId: z.string(),
            position: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.db.participant.findFirst({
        where: { sessionToken: input.sessionToken },
        include: {
          bingoGame: true,
        },
        orderBy: { createdAt: "desc" }, // Get most recent participation
      });

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participant not found",
        });
      }

      // Check if game is in ENTRY status (grid can only be edited during ENTRY)
      if (participant.bingoGame.status !== GameStatus.ENTRY) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Grid can only be edited during ENTRY status",
        });
      }

      // Delete existing assignments
      await ctx.db.participantSong.deleteMany({
        where: { participantId: participant.id },
      });

      // Create new assignments
      const participantSongs = await ctx.db.participantSong.createMany({
        data: input.songAssignments.map((assignment) => ({
          participantId: participant.id,
          songId: assignment.songId,
          position: assignment.position,
        })),
      });

      // Mark participant as having completed grid setup
      await ctx.db.participant.update({
        where: { id: participant.id },
        data: { isGridComplete: true },
      });

      return participantSongs;
    }),

  getBingoStatus: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.db.participant.findFirst({
        where: { sessionToken: input.sessionToken },
        orderBy: { createdAt: "desc" }, // Get most recent participation
        include: {
          bingoGame: {
            include: {
              songs: {
                orderBy: [{ artist: "asc" }, { title: "asc" }],
              },
            },
          },
          participantSongs: {
            include: {
              song: true,
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!participant) {
        return null;
      }

      // Create grid representation
      const gridSize = getGridSize(participant.bingoGame.size as BingoSize);
      const grid = Array(gridSize * gridSize).fill(null);

      participant.participantSongs.forEach((ps) => {
        grid[ps.position] = {
          song: ps.song,
          isPlayed: ps.song.isPlayed,
        };
      });

      return {
        participant,
        grid,
        gridSize,
        hasWon: participant.hasWon,
        wonAt: participant.wonAt,
      };
    }),
});
