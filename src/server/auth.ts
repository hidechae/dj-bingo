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
    jwt: async ({ token, account }) => {
      // Store Spotify access token and refresh token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                  `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
              },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
            }
          );

          const refreshedTokens = await response.json();

          if (!response.ok) {
            throw refreshedTokens;
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }
      }

      return token;
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
