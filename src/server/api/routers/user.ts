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

    return {
      ...user,
      hasPassword: !!user.password,
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
});