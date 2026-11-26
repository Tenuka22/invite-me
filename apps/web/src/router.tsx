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
    defaultPreloadStaleTime: 0,
    context: { orpc, queryClient },
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 250,
    defaultNotFoundComponent: NotFound,
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
