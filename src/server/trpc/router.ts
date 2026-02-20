import { router } from "./trpc";
import { customersRouter } from "./routers/customers";
import { techniciansRouter } from "./routers/technicians";
import { jobsRouter } from "./routers/jobs";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  customers: customersRouter,
  technicians: techniciansRouter,
  jobs: jobsRouter,
  analytics: analyticsRouter,
});


export type AppRouter = typeof appRouter;
