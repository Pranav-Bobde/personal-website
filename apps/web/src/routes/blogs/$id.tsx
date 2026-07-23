import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { memo, type RefObject, useEffect, useMemo, useRef, useState } from "react";

import { BlogDemoPortals } from "@/components/blog-demos/demo-portals";
import { siteConfig } from "@/lib/config";
import { getBlogPost } from "@/lib/blog-data";
import { renderMarkdown, type TocLink } from "@/lib/markdown";
import { blogPostPageSeo } from "@/lib/seo";
import {
  trackBlogFeedbackClicked,
  trackBlogScrollDepth,
  trackBlogViewed,
  type BlogScrollDepth,
} from "@/lib/analytics";

type ScrollHotkey = "j" | "k" | "d" | "u";

export const Route = createFileRoute("/blogs/$id")({
  loader: ({ params }) => {
    const post = getBlogPost(params.id);
    if (!post) {
      throw redirect({ to: "/blogs" });
    }
    return post;
  },
  head: ({ params }) => {
    const post = getBlogPost(params.id);
    return post ? blogPostPageSeo(post) : {};
  },
  component: BlogPostPage,
});

// Isolate the article HTML behind memo so scroll-spy re-renders never re-commit
// its dangerouslySetInnerHTML — otherwise React wipes the portal-mounted demos.
const ArticleHtml = memo(function ArticleHtml({
  html,
  innerRef,
}: {
  html: string;
  innerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={innerRef} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  const { html: contentHtml, toc } = useMemo(() => renderMarkdown(post.content), [post.content]);
  const contentRef = useRef<HTMLDivElement>(null);
  const activeSectionId = useActiveSectionId(toc);
  const feedbackHref = `${siteConfig.social.twitterDm}&text=${encodeURIComponent(
    `Feedback on "${post.title}": `,
  )}`;
  useBlogAnalytics(post);
  useBlogPostHotkeys(toc, feedbackHref, () => {
    trackBlogFeedbackClicked(post, "hotkey");
  });

  return (
    <div className="animate-fade-in">
      <div className="blog-post-shell mb-12">
        <div className="blog-post-layout">
          <aside className="blog-toc" aria-label="Table of contents">
            <p className="blog-toc-title">Table Of Content</p>
            <nav>
              <TocLinks activeSectionId={activeSectionId} links={toc} />
            </nav>
          </aside>

          <div className="blog-post-main">
            <header className="blog-post-header">
              <h1 className="section-title blog-post-title">{post.title}</h1>
              <p className="text-sm text-muted-foreground">
                {[post.date, post.readingTime].filter(Boolean).join(" • ")}
              </p>
            </header>

            <article className="blog-post-content">
              <ArticleHtml html={contentHtml} innerRef={contentRef} />
              <BlogDemoPortals containerRef={contentRef} contentKey={post.id} />
            </article>

            <div className="mt-12 flex items-center justify-between gap-4 border-t border-muted pt-4">
              <a
                href="/blogs"
                className="hover:text-accent flex items-center text-sm text-muted-foreground transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to all posts
              </a>
              <a
                href={feedbackHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackBlogFeedbackClicked(post, "footer");
                }}
                className="hover:text-accent flex items-center text-sm text-muted-foreground transition-colors"
              >
                [f] Give feedback
                <MessageCircle size={16} className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useActiveSectionId(toc: TocLink[]) {
  const [activeSectionId, setActiveSectionId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    if (toc.length === 0) {
      return;
    }

    const updateActiveSection = () => {
      const currentSection =
        toc
          .slice()
          .reverse()
          .find((link) => {
          const heading = document.getElementById(link.id);
          return heading ? heading.getBoundingClientRect().top <= 140 : false;
        }) ?? toc[0];

      setActiveSectionId(currentSection.id);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [toc]);

  return activeSectionId;
}

function useBlogPostHotkeys(toc: TocLink[], feedbackHref: string, onFeedbackHotkey: () => void) {
  const lastGPressTimeRef = useRef(0);
  useReaderScrollHotkeys();

  const hotkeyOptions = {
    preventDefault: true,
    stopPropagation: true,
    ignoreInputs: true,
  };

  useHotkey(
    "G",
    () => {
      const now = Date.now();
      if (now - lastGPressTimeRef.current <= 650) {
        window.scrollTo({ top: 0 });
        lastGPressTimeRef.current = 0;
        return;
      }

      lastGPressTimeRef.current = now;
    },
    hotkeyOptions,
  );

  useHotkey(
    "Shift+G",
    () => {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    },
    hotkeyOptions,
  );

  const scrollToSection = (sectionIndex: number) => {
    const sectionId = toc[sectionIndex]?.id;
    if (!sectionId) {
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
  };

  useHotkey("1", () => scrollToSection(0), hotkeyOptions);
  useHotkey("2", () => scrollToSection(1), hotkeyOptions);
  useHotkey("3", () => scrollToSection(2), hotkeyOptions);
  useHotkey("4", () => scrollToSection(3), hotkeyOptions);
  useHotkey("5", () => scrollToSection(4), hotkeyOptions);
  useHotkey("6", () => scrollToSection(5), hotkeyOptions);
  useHotkey("7", () => scrollToSection(6), hotkeyOptions);
  useHotkey("8", () => scrollToSection(7), hotkeyOptions);
  useHotkey("9", () => scrollToSection(8), hotkeyOptions);
  useHotkey("0", () => scrollToSection(9), hotkeyOptions);
  useHotkey(
    "F",
    () => {
      onFeedbackHotkey();
      window.open(feedbackHref, "_blank", "noopener,noreferrer");
    },
    hotkeyOptions,
  );
}

function useBlogAnalytics(post: ReturnType<typeof Route.useLoaderData>) {
  const reachedDepthsRef = useRef<Set<BlogScrollDepth>>(new Set());

  useEffect(() => {
    reachedDepthsRef.current = new Set();
    trackBlogViewed(post);
  }, [post]);

  useEffect(() => {
    const scrollDepths = [25, 50, 75, 100] as const satisfies readonly BlogScrollDepth[];

    const updateScrollDepth = () => {
      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableDistance <= 0) {
        return;
      }

      const scrollPercent = Math.min(
        100,
        Math.max(0, Math.round((window.scrollY / scrollableDistance) * 100)),
      );

      scrollDepths.forEach((depth) => {
        if (scrollPercent >= depth && !reachedDepthsRef.current.has(depth)) {
          reachedDepthsRef.current.add(depth);
          trackBlogScrollDepth(post, depth);
        }
      });
    };

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    window.addEventListener("resize", updateScrollDepth);

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [post]);
}

function useReaderScrollHotkeys() {
  const activeKeyRef = useRef<ScrollHotkey | null>(null);
  const isHoldingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const holdStartTimerRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const scrollLineDistance = 320;
  const getScrollPageDistance = () => Math.round(window.innerHeight * 0.7);

  useEffect(() => {
    const scrollConfig = {
      j: { direction: 1, speed: 1100, tapDistance: () => scrollLineDistance },
      k: { direction: -1, speed: 1100, tapDistance: () => scrollLineDistance },
      d: { direction: 1, speed: 2200, tapDistance: getScrollPageDistance },
      u: { direction: -1, speed: 2200, tapDistance: getScrollPageDistance },
    } satisfies Record<
      ScrollHotkey,
      { direction: 1 | -1; speed: number; tapDistance: () => number }
    >;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    };

    const hasModifierKey = (event: KeyboardEvent) =>
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

    const getScrollHotkey = (event: KeyboardEvent): ScrollHotkey | null => {
      const key = event.key.toLowerCase();
      return key in scrollConfig && !hasModifierKey(event) ? (key as ScrollHotkey) : null;
    };

    const clearHoldStartTimer = () => {
      if (holdStartTimerRef.current !== null) {
        window.clearTimeout(holdStartTimerRef.current);
      }

      holdStartTimerRef.current = null;
    };

    const stopHoldScroll = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      clearHoldStartTimer();
      animationFrameRef.current = null;
      lastFrameTimeRef.current = 0;
      isHoldingRef.current = false;
    };

    const scrollFrame = (time: number) => {
      const activeKey = activeKeyRef.current;
      if (!activeKey) {
        stopHoldScroll();
        return;
      }

      const config = scrollConfig[activeKey];
      const lastFrameTime = lastFrameTimeRef.current || time;
      const deltaSeconds = Math.min((time - lastFrameTime) / 1000, 0.05);

      window.scrollBy({ top: config.direction * config.speed * deltaSeconds, behavior: "auto" });
      lastFrameTimeRef.current = time;
      animationFrameRef.current = window.requestAnimationFrame(scrollFrame);
    };

    const startHoldScroll = () => {
      if (isHoldingRef.current) {
        return;
      }

      isHoldingRef.current = true;
      lastFrameTimeRef.current = 0;
      animationFrameRef.current = window.requestAnimationFrame(scrollFrame);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const scrollKey = getScrollHotkey(event);
      if (!scrollKey || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (activeKeyRef.current && activeKeyRef.current !== scrollKey) {
        stopHoldScroll();
      }

      activeKeyRef.current = scrollKey;

      if (event.repeat) {
        startHoldScroll();
        return;
      }

      clearHoldStartTimer();
      holdStartTimerRef.current = window.setTimeout(() => {
        startHoldScroll();
      }, 140);
    };

    const stopActiveKey = () => {
      activeKeyRef.current = null;
      stopHoldScroll();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!(key in scrollConfig) || activeKeyRef.current !== key) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const scrollKey = key as ScrollHotkey;
      clearHoldStartTimer();

      if (!isHoldingRef.current) {
        const config = scrollConfig[scrollKey];
        window.scrollBy({ top: config.direction * config.tapDistance(), behavior: "smooth" });
      }

      stopActiveKey();
    };

    const handleBlur = () => {
      stopActiveKey();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      stopHoldScroll();
    };
  }, []);
}

function TocLinks({ activeSectionId, links }: { activeSectionId: string; links: TocLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ol className="blog-toc-list">
      {links.map((link) => (
        <li key={link.id}>
          <a href={`#${link.id}`} className={link.id === activeSectionId ? "is-active" : undefined}>
            {link.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
