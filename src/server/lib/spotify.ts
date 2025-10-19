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
