import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { type GetServerSidePropsContext } from "next";
import bcrypt from "bcryptjs";

import { env } from "~/env";
import { db } from "~/server/db";
import { createRepositories } from "~/server/repositories";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
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

  // Always add credentials provider
  console.log("  ✅ Adding Credentials provider");
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
          const user = await Promise.race([
            repositories.user.findByEmailWithPassword(credentials.email),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Database timeout")), 10000)
            ),
          ]) as any;

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
        };
      } else if (token) {
        // Credentials session (JWT)
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub!,
          },
        };
      }
      return session;
    },
    jwt: ({ token, user }) => {
      // Store user id in token for credentials authentication
      if (user) {
        token.sub = user.id;
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
