import { env } from "@oreno-website.bts-migration/env/web";
import posthog from "posthog-js";

import type { BlogPost } from "@/lib/blog-data";

const SCROLL_DEPTHS = [25, 50, 75, 100] as const;

export type BlogScrollDepth = (typeof SCROLL_DEPTHS)[number];
export type BlogFeedbackSource = "footer" | "hotkey";

interface BlogAnalyticsProps {
  blog_id: string;
  blog_title: string;
  blog_slug: string;
  path: string;
  published_date?: string;
  reading_time?: string;
}

type AnalyticsEvent =
  | { name: "$pageview"; props: { path: string; url: string; title: string } }
  | { name: "blog_viewed"; props: BlogAnalyticsProps }
  | {
      name: "blog_scroll_depth_reached";
      props: BlogAnalyticsProps & { depth: BlogScrollDepth };
    }
  | {
      name: "blog_feedback_clicked";
      props: BlogAnalyticsProps & { source: BlogFeedbackSource };
    };

let isPostHogReady = false;

export function initAnalytics() {
  if (typeof window === "undefined" || isPostHogReady) {
    return;
  }

  posthog.init(env.VITE_POSTHOG_TOKEN, {
    api_host: env.VITE_POSTHOG_HOST,
    ui_host: env.VITE_POSTHOG_UI_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    defaults: "2025-05-24",
    disable_surveys: true,
    enable_heatmaps: false,
    person_profiles: "identified_only",
  });

  isPostHogReady = true;
}

export function trackPageView(path: string) {
  track({
    name: "$pageview",
    props: {
      path,
      title: typeof document === "undefined" ? "" : document.title,
      url: typeof window === "undefined" ? path : window.location.href,
    },
  });
}

export function trackBlogViewed(post: BlogPost) {
  track({
    name: "blog_viewed",
    props: getBlogAnalyticsProps(post),
  });
}

export function trackBlogScrollDepth(post: BlogPost, depth: BlogScrollDepth) {
  track({
    name: "blog_scroll_depth_reached",
    props: {
      ...getBlogAnalyticsProps(post),
      depth,
    },
  });
}

export function trackBlogFeedbackClicked(post: BlogPost, source: BlogFeedbackSource) {
  track({
    name: "blog_feedback_clicked",
    props: {
      ...getBlogAnalyticsProps(post),
      source,
    },
  });
}

function getBlogAnalyticsProps(post: BlogPost): BlogAnalyticsProps {
  return {
    blog_id: post.id,
    blog_slug: post.id,
    blog_title: post.title,
    path: typeof window === "undefined" ? `/blogs/${post.id}` : window.location.pathname,
    published_date: post.date || undefined,
    reading_time: post.readingTime || undefined,
  };
}

function track(event: AnalyticsEvent) {
  initAnalytics();

  if (!isPostHogReady) {
    return;
  }

  posthog.capture(event.name, event.props);
}
