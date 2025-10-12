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

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

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
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    // Add Google OAuth provider if credentials are available
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Email/Password authentication
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
