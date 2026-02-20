import { router } from "./trpc";
import { customersRouter } from "./routers/customers";
import { techniciansRouter } from "./routers/technicians";
import { jobsRouter } from "./routers/jobs";

export const appRouter = router({
  customers: customersRouter,
  technicians: techniciansRouter,
  jobs: jobsRouter,
});


export type AppRouter = typeof appRouter;
