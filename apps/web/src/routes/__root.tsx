import { useEffect, useState } from "react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/geist-mono";
import { Toaster } from "@/components/toaster";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ENV } from "@/env.public";
import type { orpc } from "@/utils/orpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InviteMe" },
      { name: "description", content: "Digital invitations with a link for every guest." },
    ],
    links: [
      // Open the API connection (TLS included) while the stylesheet and script download.
      { rel: "preconnect", href: ENV.VITE_SERVER_URL, crossOrigin: "use-credentials" },
      { rel: "stylesheet", href: appCss },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster />
        {import.meta.env.DEV ? <Devtools /> : null}
        <Scripts />
      </body>
    </html>
  );
}

/** Dev-only. Hidden unless the URL has ?devtools, so the buttons never cover the app's own. */
function Devtools() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(new URLSearchParams(window.location.search).has("devtools")), []);
  if (!on) return null;
  return (
    <>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
