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
});
