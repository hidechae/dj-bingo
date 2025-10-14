import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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

    const user = await ctx.repositories.user.findByEmailWithPassword(
      ctx.session.user.email
    );

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ユーザーが見つかりません",
      });
    }

    // Check for linked accounts
    const accounts = await ctx.repositories.account.findByUserId(
      ctx.session.user.id
    );
    const hasGoogleAccount = accounts.some(
      (account) => account.provider === "google"
    );

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

  // Unlink Google account
  unlinkGoogleAccount: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Check if user has password set
      if (!ctx.session.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ユーザーのメールアドレスが見つかりません",
        });
      }

      const user = await ctx.repositories.user.findByEmailWithPassword(
        ctx.session.user.email
      );
      if (!user?.password) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "パスワードが設定されていない場合、Googleアカウントの関連付けを解除できません",
        });
      }

      const userGoogleAccount =
        await ctx.repositories.account.findByProviderAndUserId(
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

  // Change password for existing user
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z
          .string()
          .min(1, "現在のパスワードを入力してください"),
        newPassword: z
          .string()
          .min(6, "新しいパスワードは6文字以上である必要があります"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.session.user.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "ユーザーのメールアドレスが見つかりません",
          });
        }

        // Get user with current password
        const user = await ctx.repositories.user.findByEmailWithPassword(
          ctx.session.user.email
        );

        if (!user || !user.password) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "パスワードが設定されていません",
          });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
          input.currentPassword,
          user.password
        );
        if (!isCurrentPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "現在のパスワードが正しくありません",
          });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

        // Update password
        await ctx.repositories.user.update(ctx.session.user.id, {
          password: hashedNewPassword,
        });

        return {
          success: true,
          message: "パスワードが正常に変更されました",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Password change error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "パスワードの変更に失敗しました",
        });
      }
    }),
});
