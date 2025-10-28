import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import CredentialsProvider from "next-auth/providers/credentials";
import { type GetServerSidePropsContext } from "next";
import bcrypt from "bcryptjs";

import { env } from "~/env";
import { db } from "~/server/db";
import { createRepositories } from "~/server/repositories";
import { UserEntity } from "~/domain/models";

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

  // Always add credentials provider
  console.log("  ✅ BEFORE Adding Credentials provider");
  try {
    providers.push(
      CredentialsProvider({
        id: "credentials",
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          console.log("📧 CREDENTIALS AUTH ATTEMPT:", {
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password,
          });

          // Early return for missing credentials to prevent unnecessary DB calls during provider init
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            return null;
          }

          try {
            console.log("🔍 Searching for user:", credentials.email);

            // Use repository layer instead of direct Prisma access
            const repositories = createRepositories(db);

            // Add timeout and connection resilience
            const user = (await Promise.race([
              repositories.user.findByEmailWithPassword(credentials.email),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Database timeout")), 10000)
              ),
            ])) as UserEntity;

            if (!user) {
              console.log("❌ User not found");
              return null;
            }

            if (!user.password) {
              console.log("❌ User has no password (OAuth-only user)");
              return null;
            }

            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isPasswordValid) {
              console.log("❌ Invalid password");
              return null;
            }

            console.log(
              "✅ Credentials authentication successful for:",
              user.email
            );
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } catch (error) {
            console.error(
              "❌ Credentials auth error (but provider still available):",
              error
            );
            // Don't throw the error - just return null to keep provider available
            // This prevents NextAuth from excluding the credentials provider due to DB issues
            return null;
          }
        },
      })
    );
    console.log("  ✅ AFTER Adding Credentials provider");
  } catch (error) {
    console.error("  ❌ ERROR Adding Credentials provider:", error);
  }

  console.log(`🚀 TOTAL PROVIDERS CREATED: ${providers.length}`);
  return providers;
};

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user, token }) => {
      // Handle both adapter (OAuth) and credentials sessions
      if (user) {
        // OAuth session (with adapter)
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
          },
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        };
      } else if (token) {
        // Credentials session (JWT)
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub!,
          },
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        };
      }
      return session;
    },
    jwt: async ({ token, user, account }) => {
      // Store user id in token for credentials authentication
      if (user) {
        token.sub = user.id;
      }

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
  // Only use adapter for OAuth providers, not for credentials
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { adapter: PrismaAdapter(db) as Adapter }
    : {}),
  session: {
    strategy: "jwt",
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
