import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { type GetServerSidePropsContext } from "next";

import { db } from "~/server/db";

// Debug logging for environment variables (masked for security)
const maskValue = (value?: string) => {
  if (!value) return "undefined";
  if (value.length <= 2) return "**";
  return value.substring(0, 2) + "*".repeat(value.length - 2);
};

console.log("[NextAuth Debug] Environment variables:");
console.log("- GOOGLE_CLIENT_ID:", maskValue(process.env.GOOGLE_CLIENT_ID));
console.log("- GOOGLE_CLIENT_SECRET:", maskValue(process.env.GOOGLE_CLIENT_SECRET));
console.log("- NEXTAUTH_SECRET:", maskValue(process.env.NEXTAUTH_SECRET));
console.log("- NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("- NODE_ENV:", process.env.NODE_ENV);

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
