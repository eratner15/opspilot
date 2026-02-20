import { router } from "./trpc";
import { customersRouter } from "./routers/customers";
import { techniciansRouter } from "./routers/technicians";
import { jobsRouter } from "./routers/jobs";
import { analyticsRouter } from "./routers/analytics";
import { callsRouter } from "./routers/calls";
import { quotesRouter } from "./routers/quotes";
import { invoicesRouter } from "./routers/invoices";
import { settingsRouter } from "./routers/settings";

export const appRouter = router({
  customers: customersRouter,
  technicians: techniciansRouter,
  jobs: jobsRouter,
  analytics: analyticsRouter,
  calls: callsRouter,
  quotes: quotesRouter,
  invoices: invoicesRouter,
  settings: settingsRouter,
});


export type AppRouter = typeof appRouter;
