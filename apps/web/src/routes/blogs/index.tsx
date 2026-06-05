import { createFileRoute } from "@tanstack/react-router";

import { BlogsClient } from "@/components/blogs-client";
import { getBlogPosts } from "@/lib/blog-data";
import { blogIndexPageSeo } from "@/lib/seo";

const blogIndexSeo = blogIndexPageSeo();

export const Route = createFileRoute("/blogs/")({
  loader: () => getBlogPosts(),
  head: () => blogIndexSeo,
  component: BlogsPage,
});

function BlogsPage() {
  const posts = Route.useLoaderData();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">blog</h1>
        {posts.length > 0 ? (
          <p className="mb-8 text-sm text-muted-foreground">
            use <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">j/k</kbd> or{" "}
            <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">↑/↓</kbd> for entries •{" "}
            <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">ctrl + h/l</kbd> or{" "}
            <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">←/→</kbd> for pages
          </p>
        ) : null}
        <BlogsClient posts={posts} />
      </div>
    </div>
  );
}
