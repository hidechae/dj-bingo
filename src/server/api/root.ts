import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { bingoRouter } from "~/server/api/routers/bingo";
import { participantRouter } from "~/server/api/routers/participant";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  bingo: bingoRouter,
  participant: participantRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
