import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
});
