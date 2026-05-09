import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { evlogErrorHandler } from "evlog/nitro/v3";
import { HotkeysProvider } from "@tanstack/react-hotkeys";

import type { orpc } from "@/utils/orpc";
import { siteConfig } from "@/lib/config";

import { Navigation } from "@/components/navigation";

import appCss from "../index.css?url";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  server: {
    middleware: [createMiddleware().server(evlogErrorHandler)],
  },

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
        title: `${siteConfig.name} | ${siteConfig.title}`,
      },
      {
        name: "description",
        content: siteConfig.bio.main,
      },
      {
        name: "generator",
        content: "v0.dev",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <HotkeysProvider>
          <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
            <div className="mx-auto w-full max-w-3xl">
              <Navigation />
              <Outlet />
            </div>
          </main>
        </HotkeysProvider>
        <Scripts />
      </body>
    </html>
  );
}
