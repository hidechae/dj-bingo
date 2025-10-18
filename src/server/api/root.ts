import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { bingoRouter } from "~/server/api/routers/bingo";
import { participantRouter } from "~/server/api/routers/participant";
import { userRouter } from "~/server/api/routers/user";
import { spotifyRouter } from "~/server/api/routers/spotify";

export const appRouter = createTRPCRouter({
  bingo: bingoRouter,
  participant: participantRouter,
  user: userRouter,
  spotify: spotifyRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
