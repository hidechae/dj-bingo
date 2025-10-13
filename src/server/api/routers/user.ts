import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const setPasswordSchema = z.object({
  password: z.string().min(6, "パスワードは6文字以上である必要があります"),
});

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.repositories.user.findById(ctx.session.user.id);
    
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ユーザーが見つかりません",
      });
    }

    return user;
  }),

  // Get current user with password info (to check if password is set)
  getProfileWithPasswordInfo: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "ユーザーのメールアドレスが見つかりません",
      });
    }

    const user = await ctx.repositories.user.findByEmailWithPassword(ctx.session.user.email);
    
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ユーザーが見つかりません",
      });
    }

    // Check for linked accounts
    const accounts = await ctx.repositories.account.findByUserId(ctx.session.user.id);
    const hasGoogleAccount = accounts.some(account => account.provider === "google");

    return {
      ...user,
      hasPassword: !!user.password,
      hasGoogleAccount,
      password: undefined, // Remove password from response for security
    };
  }),

  // Set password for existing user
  setPassword: protectedProcedure
    .input(setPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // Update the user's password
        await ctx.repositories.user.update(ctx.session.user.id, {
          password: hashedPassword,
        });

        return {
          success: true,
          message: "パスワードが正常に設定されました",
        };
      } catch (error) {
        console.error("Password setting error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "パスワードの設定に失敗しました",
        });
      }
    }),

  // Get Google OAuth URL for linking account
  getGoogleLinkUrl: protectedProcedure.query(async ({ ctx }) => {
    // Generate a state parameter for security
    const state = ctx.session.user.id;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/auth/callback/google-link`;
    
    return {
      url: `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}&state=${state}`,
      message: "GoogleアカウントとのリンクURLを生成しました",
    };
  }),

  // Link Google account to existing user
  linkGoogleAccount: protectedProcedure
    .input(z.object({
      googleId: z.string(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if this Google account is already linked to another user
        const existingAccount = await ctx.repositories.account.findByProviderAndProviderAccountId(
          "google",
          input.googleId
        );

        if (existingAccount && existingAccount.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "このGoogleアカウントは既に別のユーザーに関連付けられています",
          });
        }

        // Check if the current user already has a Google account linked
        const userGoogleAccount = await ctx.repositories.account.findByProviderAndUserId(
          "google",
          ctx.session.user.id
        );

        if (userGoogleAccount) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "このユーザーには既にGoogleアカウントが関連付けられています",
          });
        }

        // Link the Google account
        await ctx.repositories.account.create({
          userId: ctx.session.user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: input.googleId,
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        });

        return {
          success: true,
          message: "Googleアカウントが正常に関連付けられました",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Google account linking error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Googleアカウントの関連付けに失敗しました",
        });
      }
    }),

  // Unlink Google account
  unlinkGoogleAccount: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userGoogleAccount = await ctx.repositories.account.findByProviderAndUserId(
        "google",
        ctx.session.user.id
      );

      if (!userGoogleAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "関連付けられたGoogleアカウントが見つかりません",
        });
      }

      await ctx.repositories.account.deleteByProviderAndUserId(
        "google",
        ctx.session.user.id
      );

      return {
        success: true,
        message: "Googleアカウントの関連付けを解除しました",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Google account unlinking error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Googleアカウントの関連付け解除に失敗しました",
      });
    }
  }),
});