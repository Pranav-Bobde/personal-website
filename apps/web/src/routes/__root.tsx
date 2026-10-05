import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { evlogErrorHandler } from "evlog/nitro/v3";
import { HotkeysProvider } from "@tanstack/react-hotkeys";

import { Navigation } from "@/components/navigation";
import { AnalyticsProvider } from "@/components/analytics-provider";

import appCss from "../index.css?url";

export const Route = createRootRoute({
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
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const isBlogPostRoute = pathname.startsWith("/blogs/");

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <HotkeysProvider>
          <AnalyticsProvider>
            <main className="flex min-h-screen flex-col items-center p-4 pt-16 md:p-8 md:pt-24">
              <div className={`mx-auto w-full ${isBlogPostRoute ? "max-w-7xl" : "max-w-3xl"}`}>
                <Navigation />
                <Outlet />
              </div>
            </main>
          </AnalyticsProvider>
        </HotkeysProvider>
        <Scripts />
      </body>
    </html>
  );
}
