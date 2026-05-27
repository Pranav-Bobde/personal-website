import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { initAnalytics, trackPageView } from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    initAnalytics();
  }, []);

  return <PageViewTracker pathname={pathname}>{children}</PageViewTracker>;
}

function PageViewTracker({ children, pathname }: AnalyticsProviderProps & { pathname: string }) {
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return children;
}
