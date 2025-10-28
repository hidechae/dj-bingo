import SpotifyWebApi from "spotify-web-api-node";
import { env } from "~/env";

/**
 * Spotify APIクライアントのシングルトンインスタンス
 */
let spotifyApi: SpotifyWebApi | null = null;

/**
 * Spotify APIクライアントを取得または初期化
 */
function getSpotifyClient(): SpotifyWebApi {
  if (!spotifyApi) {
    spotifyApi = new SpotifyWebApi({
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
    });
  }
  return spotifyApi;
}

/**
 * ユーザーのアクセストークンを使用してSpotify APIクライアントを作成
 */
export function createUserSpotifyClient(accessToken: string): SpotifyWebApi {
  const client = new SpotifyWebApi({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  });
  client.setAccessToken(accessToken);
  return client;
}

/**
 * Client Credentials Flowでアクセストークンを取得
 */
async function refreshAccessToken() {
  const client = getSpotifyClient();
  const data = await client.clientCredentialsGrant();
  client.setAccessToken(data.body.access_token);
  return data.body.access_token;
}

/**
 * Spotify URLまたはIDからプレイリストIDを抽出
 * @param input - プレイリストURLまたはID
 * @returns プレイリストID
 */
export function extractPlaylistId(input: string): string {
  // URLの場合: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  const urlMatch = input.match(
    /(?:https?:\/\/)?(?:open\.spotify\.com\/playlist\/)([a-zA-Z0-9]+)/
  );
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M形式
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1];
  }

  // IDそのまま
  return input.trim();
}

/**
 * SpotifyプレイリストからトラックIDのリストを取得
 * @param playlistId - プレイリストID
 * @returns トラック情報の配列
 */
export async function getPlaylistTracks(playlistId: string) {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw new Error(
      "Spotify API credentials are not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment variables."
    );
  }

  const client = getSpotifyClient();

  // アクセストークンを取得
  await refreshAccessToken();

  const tracks: Array<{ title: string; artist: string }> = [];
  let offset = 0;
  const limit = 100;

  // ページネーション対応で全てのトラックを取得
  while (true) {
    const response = await client.getPlaylistTracks(playlistId, {
      offset,
      limit,
    });

    const items = response.body.items;

    for (const item of items) {
      if (item.track && item.track.name) {
        tracks.push({
          title: item.track.name,
          artist:
            item.track.artists.map((artist) => artist.name).join(", ") || "",
        });
      }
    }

    // 次のページがなければ終了
    if (items.length < limit) {
      break;
    }

    offset += limit;
  }

  return tracks;
}

/**
 * Spotifyプレイリストの情報を取得
 * @param playlistId - プレイリストID
 * @returns プレイリスト情報
 */
export async function getPlaylistInfo(playlistId: string) {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw new Error(
      "Spotify API credentials are not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment variables."
    );
  }

  const client = getSpotifyClient();

  // アクセストークンを取得
  await refreshAccessToken();

  const response = await client.getPlaylist(playlistId);

  return {
    name: response.body.name,
    description: response.body.description,
    trackCount: response.body.tracks.total,
    owner: response.body.owner.display_name,
  };
}

/**
 * ユーザーのプレイリスト一覧を取得（ページネーション対応）
 * @param client - ユーザー認証済みのSpotifyクライアント
 * @param limit - 取得件数
 * @param offset - オフセット
 * @returns プレイリスト一覧
 */
export async function getUserPlaylists(
  client: SpotifyWebApi,
  limit = 20,
  offset = 0
) {
  const response = await client.getUserPlaylists({ limit, offset });

  return {
    items: response.body.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackCount: playlist.tracks.total,
      imageUrl: playlist.images[0]?.url,
      owner: playlist.owner.display_name,
    })),
    total: response.body.total,
    hasMore: response.body.next !== null,
  };
}

/**
 * プレイリストのトラックを取得（ユーザー認証版）
 * @param client - ユーザー認証済みのSpotifyクライアント
 * @param playlistId - プレイリストID
 * @returns トラック情報の配列
 */
export async function getUserPlaylistTracks(
  client: SpotifyWebApi,
  playlistId: string
) {
  const tracks: Array<{ title: string; artist: string }> = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await client.getPlaylistTracks(playlistId, {
      offset,
      limit,
    });

    const items = response.body.items;

    for (const item of items) {
      if (item.track && item.track.name) {
        tracks.push({
          title: item.track.name,
          artist:
            item.track.artists.map((artist) => artist.name).join(", ") || "",
        });
      }
    }

    if (items.length < limit) {
      break;
    }

    offset += limit;
  }

  return tracks;
}

/**
 * Spotify検索（トラック、アルバム、プレイリスト）
 * @param client - ユーザー認証済みのSpotifyクライアント
 * @param query - 検索クエリ
 * @param types - 検索タイプ（track, album, playlist）
 * @param limit - 取得件数
 * @returns 検索結果
 */
export async function searchSpotify(
  client: SpotifyWebApi,
  query: string,
  types: Array<"track" | "album" | "playlist"> = ["track", "album", "playlist"],
  limit = 20
) {
  const response = await client.search(query, types, { limit });

  const result: {
    tracks?: Array<{ title: string; artist: string; album?: string }>;
    albums?: Array<{
      id: string;
      name: string;
      artist: string;
      imageUrl?: string;
      trackCount: number;
    }>;
    playlists?: Array<{
      id: string;
      name: string;
      description?: string;
      trackCount: number;
      imageUrl?: string;
      owner: string;
    }>;
  } = {};

  if (response.body.tracks) {
    result.tracks = response.body.tracks.items.map((track) => ({
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
    }));
  }

  if (response.body.albums) {
    result.albums = response.body.albums.items.map((album) => ({
      id: album.id,
      name: album.name,
      artist: album.artists.map((artist) => artist.name).join(", "),
      imageUrl: album.images[0]?.url,
      trackCount: album.total_tracks,
    }));
  }

  if (response.body.playlists) {
    result.playlists = response.body.playlists.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? undefined,
      trackCount: playlist.tracks.total,
      imageUrl: playlist.images[0]?.url,
      owner: playlist.owner.display_name ?? "Unknown",
    }));
  }

  return result;
}

/**
 * アルバムのトラックを取得
 * @param client - ユーザー認証済みのSpotifyクライアント
 * @param albumId - アルバムID
 * @returns トラック情報の配列
 */
export async function getAlbumTracks(client: SpotifyWebApi, albumId: string) {
  const tracks: Array<{ title: string; artist: string }> = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await client.getAlbumTracks(albumId, { offset, limit });

    const items = response.body.items;

    for (const item of items) {
      tracks.push({
        title: item.name,
        artist: item.artists.map((artist) => artist.name).join(", "),
      });
    }

    if (items.length < limit) {
      break;
    }

    offset += limit;
  }

  return tracks;
}
