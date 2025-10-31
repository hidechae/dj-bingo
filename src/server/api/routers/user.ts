import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

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

  // Get linked accounts
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await db.account.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
      },
    });

    return accounts;
  }),

  // Update user name
  updateName: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "名前を入力してください").max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.repositories.user.update(ctx.session.user.id, {
        name: input.name,
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      return user;
    }),

  // Unlink account
  unlinkAccount: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "spotify"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 連携されているアカウント数を確認
      const accountCount = await db.account.count({
        where: {
          userId: ctx.session.user.id,
        },
      });

      // 最後のアカウントは削除できない
      if (accountCount <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "最後のアカウントは削除できません。別のログイン方法を連携してから削除してください。",
        });
      }

      // アカウントを削除
      const deleted = await db.account.deleteMany({
        where: {
          userId: ctx.session.user.id,
          provider: input.provider,
        },
      });

      if (deleted.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "連携されているアカウントが見つかりません",
        });
      }

      return { success: true };
    }),
});
