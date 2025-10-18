import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  extractPlaylistId,
  getPlaylistTracks,
  getPlaylistInfo,
} from "~/server/lib/spotify";

export const spotifyRouter = createTRPCRouter({
  /**
   * Spotifyプレイリストの情報を取得
   */
  getPlaylistInfo: protectedProcedure
    .input(
      z.object({
        playlistUrl: z
          .string()
          .min(1, "プレイリストURLまたはIDを入力してください"),
      })
    )
    .query(async ({ input }) => {
      try {
        const playlistId = extractPlaylistId(input.playlistUrl);
        const info = await getPlaylistInfo(playlistId);
        return info;
      } catch (error) {
        console.error("Spotify API Error:", error);
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `プレイリスト情報の取得に失敗しました: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "プレイリスト情報の取得に失敗しました",
        });
      }
    }),

  /**
   * Spotifyプレイリストから楽曲を取得
   */
  getPlaylistTracks: protectedProcedure
    .input(
      z.object({
        playlistUrl: z
          .string()
          .min(1, "プレイリストURLまたはIDを入力してください"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const playlistId = extractPlaylistId(input.playlistUrl);
        const tracks = await getPlaylistTracks(playlistId);

        return {
          tracks,
          count: tracks.length,
        };
      } catch (error) {
        console.error("Spotify API Error:", error);
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `プレイリストの取得に失敗しました: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "プレイリストの取得に失敗しました",
        });
      }
    }),
});
