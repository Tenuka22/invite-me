import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { PageSkeleton } from "./components/skeletons";
import { NotFound } from "./components/not-found";
import { RouteError } from "./components/route-error";
import { routeTree } from "./routeTree.gen";
import { createQueryClient, orpc } from "./utils/orpc";

export const getRouter = () => {
  const queryClient = createQueryClient();

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    // Hover/touch preloads stay fresh for 30s so the click that follows reuses them instead of refetching.
    defaultPreloadStaleTime: 30_000,
    context: { orpc, queryClient },
    defaultPendingComponent: PageSkeleton,
    // Show the skeleton only when a route is actually slow, and never hold it past the data.
    defaultPendingMs: 400,
    defaultPendingMinMs: 0,
    defaultNotFoundComponent: () => <NotFound />,
    defaultErrorComponent: RouteError,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
