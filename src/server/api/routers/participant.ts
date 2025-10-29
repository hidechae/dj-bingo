import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getGridSize } from "~/types";
import { GameStatus } from "~/domain/models";

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
      const bingoGame = await ctx.repositories.bingoGame.findByIdWithSongs(
        input.bingoGameId
      );

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
      const existingParticipant = await ctx.repositories.participant.findFirst({
        sessionToken: input.sessionToken,
        bingoGameId: input.bingoGameId,
      });

      if (existingParticipant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already joined this game",
        });
      }

      const participant = await ctx.repositories.participant.create({
        name: input.name,
        bingoGameId: input.bingoGameId,
        sessionToken: input.sessionToken,
      });

      // Return participant with bingoGame info
      return {
        ...participant,
        bingoGame,
      };
    }),

  getBySessionToken: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        bingoGameId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // If bingoGameId is provided, find participant for specific game
      if (input.bingoGameId) {
        const participant =
          await ctx.repositories.participant.findFirstWithSongs({
            sessionToken: input.sessionToken,
            bingoGameId: input.bingoGameId,
          });

        if (!participant) return null;

        // Get bingoGame with songs
        const bingoGame = await ctx.repositories.bingoGame.findByIdWithSongs(
          participant.bingoGameId
        );

        return {
          ...participant,
          bingoGame,
        };
      }

      // If no bingoGameId provided, return first participant found (backward compatibility)
      const participant = await ctx.repositories.participant.findFirstWithSongs(
        {
          sessionToken: input.sessionToken,
        }
      );

      if (!participant) return null;

      // Get bingoGame with songs
      const bingoGame = await ctx.repositories.bingoGame.findByIdWithSongs(
        participant.bingoGameId
      );

      return {
        ...participant,
        bingoGame,
      };
    }),

  assignSongs: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        bingoGameId: z.string(),
        songAssignments: z.array(
          z.object({
            songId: z.string(),
            position: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find participant for specific game
      const participant = await ctx.repositories.participant.findFirst({
        sessionToken: input.sessionToken,
        bingoGameId: input.bingoGameId,
      });

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participant not found",
        });
      }

      // Get game to check status
      const bingoGame = await ctx.repositories.bingoGame.findById(
        participant.bingoGameId
      );

      if (!bingoGame) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      // Check if game is in ENTRY status (grid can only be edited during ENTRY)
      if (bingoGame.status !== GameStatus.ENTRY) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Grid can only be edited during ENTRY status",
        });
      }

      // Delete existing assignments
      await ctx.repositories.participantSong.deleteMany({
        participantId: participant.id,
      });

      // Create new assignments
      const count = await ctx.repositories.participantSong.createMany(
        input.songAssignments.map((assignment) => ({
          participantId: participant.id,
          songId: assignment.songId,
          position: assignment.position,
        }))
      );

      // Mark participant as having completed grid setup
      await ctx.repositories.participant.update(participant.id, {
        isGridComplete: true,
      });

      return { count };
    }),

  getBingoStatus: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        bingoGameId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Find participant for specific game
      const participant = await ctx.repositories.participant.findFirstWithSongs(
        {
          sessionToken: input.sessionToken,
          bingoGameId: input.bingoGameId,
        }
      );

      if (!participant) {
        return null;
      }

      // Get bingoGame with songs
      const bingoGame = await ctx.repositories.bingoGame.findByIdWithSongs(
        participant.bingoGameId
      );

      if (!bingoGame) {
        return null;
      }

      // Create grid representation
      const gridSize = getGridSize(bingoGame.size);
      const grid = Array(gridSize * gridSize).fill(null);

      participant.participantSongs.forEach((ps) => {
        grid[ps.position] = {
          song: ps.song,
          isPlayed: ps.song.isPlayed,
        };
      });

      return {
        participant: {
          ...participant,
          bingoGame,
        },
        grid,
        gridSize,
        hasWon: participant.hasWon,
        wonAt: participant.wonAt,
      };
    }),

  updateName: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        bingoGameId: z.string(),
        name: z.string().min(1, "Name cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find participant by session token and game ID
      const participant = await ctx.repositories.participant.findFirst({
        sessionToken: input.sessionToken,
        bingoGameId: input.bingoGameId,
      });

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participant not found",
        });
      }

      // Update participant name
      const updatedParticipant = await ctx.repositories.participant.update(
        participant.id,
        { name: input.name }
      );

      return updatedParticipant;
    }),
});
