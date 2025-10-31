import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import EmailProvider from "next-auth/providers/email";
import { type GetServerSidePropsContext } from "next";

import { env } from "~/env";
import { db } from "~/server/db";
import { sendMagicLinkEmail } from "~/server/services/emailService";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}

// Log environment variables for debugging (without exposing secrets)
console.log("🔧 AUTH CONFIG DEBUG:");
console.log(
  "  - Google OAuth configured:",
  !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
);
console.log("  - GOOGLE_CLIENT_ID exists:", !!env.GOOGLE_CLIENT_ID);
console.log("  - GOOGLE_CLIENT_SECRET exists:", !!env.GOOGLE_CLIENT_SECRET);
console.log(
  "  - Spotify OAuth configured:",
  !!(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET)
);
console.log("  - SPOTIFY_CLIENT_ID exists:", !!env.SPOTIFY_CLIENT_ID);
console.log("  - SPOTIFY_CLIENT_SECRET exists:", !!env.SPOTIFY_CLIENT_SECRET);
console.log("  - DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("  - NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
console.log("  - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

// Create providers array dynamically to ensure credentials provider is always included
const createProviders = () => {
  console.log("🏗️ CREATING PROVIDERS...");

  const providers = [];

  // Add Google OAuth provider if credentials are available
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    console.log("  ✅ Adding Google OAuth provider");
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    );
  } else {
    console.log("  ❌ Google OAuth not configured");
  }

  // Add Spotify OAuth provider if credentials are available
  if (env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
    console.log("  ✅ Adding Spotify OAuth provider");
    providers.push(
      SpotifyProvider({
        clientId: env.SPOTIFY_CLIENT_ID,
        clientSecret: env.SPOTIFY_CLIENT_SECRET,
        authorization: {
          params: {
            scope:
              "user-read-email playlist-read-private playlist-read-collaborative user-library-read",
          },
        },
      })
    );
  } else {
    console.log("  ❌ Spotify OAuth not configured");
  }

  // Add Email provider for passwordless authentication
  if (env.RESEND_API_KEY) {
    console.log("  ✅ Adding Email provider (passwordless)");
    providers.push(
      EmailProvider({
        server: "", // Resendを使うので不要
        from: "DJ Bingo <noreply@example.com>", // ダミー値（実際の送信はsendMagicLinkEmailで行う）
        maxAge: 10 * 60, // 10分間有効
        async sendVerificationRequest({ identifier: email, url }) {
          const { host } = new URL(url);
          await sendMagicLinkEmail({ email, url, host });
        },
      })
    );
  } else {
    console.log("  ❌ Email provider not configured (RESEND_API_KEY missing)");
  }

  console.log(`🚀 TOTAL PROVIDERS CREATED: ${providers.length}`);
  return providers;
};

/**
 * Spotifyのアクセストークンをリフレッシュする関数
 */
async function refreshSpotifyAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number; refreshToken?: string }> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to refresh Spotify token:", data);
    throw new Error("Failed to refresh access token");
  }

  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    refreshToken: data.refresh_token,
  };
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, user }) {
      // Handle adapter sessions (OAuth and Email)
      // database戦略ではtokenは存在しない
      if (user) {
        // 初回ログイン時に名前が未設定の場合、メールアドレスの@より前を初期値として設定
        if (user.email && !user.name) {
          const nameFromEmail = user.email.split("@")[0];
          if (nameFromEmail) {
            await db.user.update({
              where: { id: user.id },
              data: { name: nameFromEmail },
            });
            // セッションにも反映
            user.name = nameFromEmail;
          }
        }

        // Spotifyアカウントを取得
        const spotifyAccount = await db.account.findFirst({
          where: {
            userId: user.id,
            provider: "spotify",
          },
        });

        // Spotifyアカウントが連携されている場合、トークンをセッションに追加
        if (spotifyAccount) {
          let accessToken = spotifyAccount.access_token;
          let refreshToken = spotifyAccount.refresh_token;

          // トークンの有効期限をチェック
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = spotifyAccount.expires_at ?? 0;

          // トークンが期限切れまたは5分以内に期限切れになる場合、リフレッシュ
          if (refreshToken && expiresAt < now + 300) {
            try {
              console.log("🔄 Refreshing Spotify access token...");
              const refreshedTokens =
                await refreshSpotifyAccessToken(refreshToken);

              // データベースを更新
              await db.account.update({
                where: {
                  id: spotifyAccount.id,
                },
                data: {
                  access_token: refreshedTokens.accessToken,
                  expires_at: refreshedTokens.expiresAt,
                  refresh_token: refreshedTokens.refreshToken ?? refreshToken,
                },
              });

              accessToken = refreshedTokens.accessToken;
              refreshToken = refreshedTokens.refreshToken ?? refreshToken;
              console.log("✅ Spotify access token refreshed successfully");
            } catch (error) {
              console.error("❌ Error refreshing Spotify access token:", error);
              // リフレッシュに失敗した場合でも、既存のトークンを返す
              // （ユーザーに再ログインを促すため）
            }
          }

          return {
            ...session,
            user: {
              ...session.user,
              id: user.id,
              name: user.name,
            },
            accessToken,
            refreshToken,
          };
        }

        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            name: user.name,
          },
        };
      }
      return session;
    },
  },
  // Use adapter for OAuth and Email providers
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "database", // Email providerにはdatabase strategyが必要
  },
  providers: createProviders(),
  pages: {
    signIn: "/auth/signin",
  },
};

// Log the final provider configuration
const providers = authOptions.providers;
console.log("🚀 FINAL PROVIDERS CONFIGURED:");
providers.forEach((provider, index) => {
  console.log(`  ${index + 1}. ${provider.id} (${provider.name})`);
});

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
