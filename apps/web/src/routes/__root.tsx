import "@fontsource-variable/inter";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource/marcellus";
import { Toaster } from "@/components/toaster";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { orpc } from "@/utils/orpc";

import appCss from "../index.css?url";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/logo.svg",
      },
    ],
  }),

  component: RootDocument,
});

function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(min-width: 768px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
}

function RootDocument() {
  const isDesktop = useIsDesktop();
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="grid min-h-svh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr]">
          <Outlet />
        </div>
        <Toaster />
        {isDesktop && <TanStackRouterDevtools position="bottom-right" />}
        <ReactQueryDevtools position="bottom" buttonPosition="top-right" />
        <Scripts />
      </body>
    </html>
  );
}
