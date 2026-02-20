import { router } from "./trpc";
import { customersRouter } from "./routers/customers";
import { techniciansRouter } from "./routers/technicians";
import { jobsRouter } from "./routers/jobs";
import { analyticsRouter } from "./routers/analytics";
import { callsRouter } from "./routers/calls";

export const appRouter = router({
  customers: customersRouter,
  technicians: techniciansRouter,
  jobs: jobsRouter,
  analytics: analyticsRouter,
  calls: callsRouter,
});


export type AppRouter = typeof appRouter;
