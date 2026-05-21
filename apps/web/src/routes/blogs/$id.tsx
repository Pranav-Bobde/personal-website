import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { renderMarkdown, type TocLink } from "@/lib/markdown";
import { fetchBlogPost } from "@/server/blogs";

export const Route = createFileRoute("/blogs/$id")({
  loader: async ({ params }) => {
    const post = await fetchBlogPost({ data: { id: params.id } });
    if (!post) {
      throw redirect({ to: "/blogs" });
    }
    return post;
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const post = Route.useLoaderData();
  const { html: contentHtml, toc } = renderMarkdown(post.content);

  return (
    <div className="animate-fade-in">
      <div className="blog-post-shell mb-12">
        <div className="blog-post-layout">
          <aside className="blog-toc" aria-label="Table of contents">
            <p className="blog-toc-title">Table Of Content</p>
            <nav>
              <TocLinks links={toc} />
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
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </article>

            <div className="mt-12 border-t border-muted pt-4">
              <a
                href="/blogs"
                className="hover:text-accent flex items-center text-sm text-muted-foreground transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to all posts
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TocLinks({ links }: { links: TocLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ol className="blog-toc-list">
      {links.map((link) => (
        <li key={link.id}>
          <a href={`#${link.id}`}>{link.text}</a>
        </li>
      ))}
    </ol>
  );
}
