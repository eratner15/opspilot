import { router } from "./trpc";

export const appRouter = router({
  // Routers will be added here as they are built
});

export type AppRouter = typeof appRouter;
