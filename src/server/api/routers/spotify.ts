import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  extractPlaylistId,
  getPlaylistTracks,
  getPlaylistInfo,
  createUserSpotifyClient,
  getUserPlaylists,
  getUserPlaylistTracks,
  searchSpotify,
  getAlbumTracks,
} from "~/server/lib/spotify";

export const spotifyRouter = createTRPCRouter({
  /**
   * Spotify連携が有効かどうかを確認
   */
  isSpotifyEnabled: protectedProcedure.query(() => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    return {
      enabled: Boolean(clientId && clientSecret),
    };
  }),

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

  /**
   * ユーザーのプレイリスト一覧を取得
   */
  getUserPlaylists: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const accessToken = ctx.session.accessToken;
        if (!accessToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Spotifyアカウントと連携してください",
          });
        }

        const client = createUserSpotifyClient(accessToken);
        const result = await getUserPlaylists(
          client,
          input.limit,
          input.offset
        );

        return result;
      } catch (error) {
        console.error("Spotify API Error:", error);

        // Spotifyのトークンエラーをチェック
        if (error instanceof Error && error.message.includes("401")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Spotifyのアクセストークンが無効です。ページを再読み込みしてください。",
          });
        }

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

  /**
   * ユーザーのプレイリストからトラックを取得
   */
  getUserPlaylistTracks: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().min(1, "プレイリストIDが必要です"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const accessToken = ctx.session.accessToken;
        if (!accessToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Spotifyアカウントと連携してください",
          });
        }

        const client = createUserSpotifyClient(accessToken);
        const tracks = await getUserPlaylistTracks(client, input.playlistId);

        return {
          tracks,
          count: tracks.length,
        };
      } catch (error) {
        console.error("Spotify API Error:", error);

        // Spotifyのトークンエラーをチェック
        if (error instanceof Error && error.message.includes("401")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Spotifyのアクセストークンが無効です。ページを再読み込みしてください。",
          });
        }

        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `トラックの取得に失敗しました: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "トラックの取得に失敗しました",
        });
      }
    }),

  /**
   * Spotify検索
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, "検索キーワードを入力してください"),
        types: z
          .array(z.enum(["track", "album", "playlist"]))
          .optional()
          .default(["track", "album", "playlist"]),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const accessToken = ctx.session.accessToken;
        if (!accessToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Spotifyアカウントと連携してください",
          });
        }

        const client = createUserSpotifyClient(accessToken);
        const result = await searchSpotify(
          client,
          input.query,
          input.types,
          input.limit
        );

        return result;
      } catch (error) {
        console.error("Spotify API Error:", error);

        // Spotifyのトークンエラーをチェック
        if (error instanceof Error && error.message.includes("401")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Spotifyのアクセストークンが無効です。ページを再読み込みしてください。",
          });
        }

        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `検索に失敗しました: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "検索に失敗しました",
        });
      }
    }),

  /**
   * アルバムのトラックを取得
   */
  getAlbumTracks: protectedProcedure
    .input(
      z.object({
        albumId: z.string().min(1, "アルバムIDが必要です"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const accessToken = ctx.session.accessToken;
        if (!accessToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Spotifyアカウントと連携してください",
          });
        }

        const client = createUserSpotifyClient(accessToken);
        const tracks = await getAlbumTracks(client, input.albumId);

        return {
          tracks,
          count: tracks.length,
        };
      } catch (error) {
        console.error("Spotify API Error:", error);

        // Spotifyのトークンエラーをチェック
        if (error instanceof Error && error.message.includes("401")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Spotifyのアクセストークンが無効です。ページを再読み込みしてください。",
          });
        }

        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `トラックの取得に失敗しました: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "トラックの取得に失敗しました",
        });
      }
    }),
});
