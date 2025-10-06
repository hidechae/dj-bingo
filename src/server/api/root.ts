import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { bingoRouter } from "~/server/api/routers/bingo";
import { participantRouter } from "~/server/api/routers/participant";

export const appRouter = createTRPCRouter({
  bingo: bingoRouter,
  participant: participantRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
