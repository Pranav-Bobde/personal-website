import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import type { BlogPost } from "@/lib/blog-data";

const POSTS_PER_PAGE = 4;

interface BlogsClientProps {
  posts: BlogPost[];
}

export function BlogsClient({ posts }: BlogsClientProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE;
  const visiblePosts = posts.slice(pageStart, pageStart + POSTS_PER_PAGE);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(1, page - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }, [totalPages]);

  const { activeIndex } = useKeyboardNavigation({
    itemSelector: ".blog-item",
    onEnter: (element) => {
      const href = element.getAttribute("data-href");
      if (href) {
        window.location.href = href;
      }
    },
    onPreviousPage: goToPreviousPage,
    onNextPage: goToNextPage,
    searchEnabled: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="blog-empty-state py-2 text-muted-foreground">
        <p>no blogs yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {visiblePosts.map((post, index) => (
          <Link key={post.id} to="/blogs/$id" params={{ id: post.id }}>
            <div
              className={`blog-item entry-item group ${activeIndex === index ? "is-active" : ""}`}
              tabIndex={0}
              data-href={`/blogs/${post.id}`}
            >
              <div className="grid gap-1 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-4">
                <span className="text-sm text-muted-foreground">{post.date.toLowerCase()}</span>
                <h2 className="blog-item-title leading-relaxed font-medium group-hover:text-foreground">
                  {post.title}
                </h2>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {post.readingTime}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-sm">
        <button
          type="button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="nav-item disabled:pointer-events-none disabled:opacity-40"
        >
          [Ctrl+H] prev
        </button>
        <span className="text-muted-foreground">
          page <span className="text-foreground">{currentPage}</span> / {totalPages}
        </span>
        <button
          type="button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="nav-item disabled:pointer-events-none disabled:opacity-40"
        >
          [Ctrl+L] next
        </button>
      </div>
    </>
  );
}
