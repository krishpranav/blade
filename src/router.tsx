/* eslint-disable react-refresh/only-export-components */

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { HomePage } from "./routes/index";
import { DiscoverPage } from "./routes/discover";
import { PulsePage } from "./routes/pulse";
import { PerpsPage } from "./routes/perps";
import { YieldPage } from "./routes/yield";
import { PortfolioPage } from "./routes/portfolio";
import { TokenPage } from "./routes/token.$mint";

function DefaultErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Blade
        </a>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route is not part of the Blade terminal.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discover",
  component: DiscoverPage,
});

const pulseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pulse",
  component: PulsePage,
});

const perpsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/perps",
  component: PerpsPage,
});

const yieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/yield",
  component: YieldPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: PortfolioPage,
});

const tokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/token/$mint",
  component: TokenPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  discoverRoute,
  pulseRoute,
  perpsRoute,
  yieldRoute,
  portfolioRoute,
  tokenRoute,
]);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
});

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorComponent,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
