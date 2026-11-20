import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { createQueryClient, orpc } from "./utils/orpc";

export const getRouter = () => {
  const queryClient = createQueryClient();

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    context: { orpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => (
      <main className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-4xl tracking-[-0.02em]">Page not found</p>
          <p className="mt-2 text-muted-foreground">That link doesn't lead anywhere.</p>
          <a href="/" className="mt-6 inline-block font-medium text-primary hover:underline">
            Back to Invite Me
          </a>
        </div>
      </main>
    ),
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
