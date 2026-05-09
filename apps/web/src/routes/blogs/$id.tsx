import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { markdownToHtml } from "@/lib/markdown";
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
  const contentHtml = markdownToHtml(post.content);

  return (
    <div className="animate-fade-in">
      <div className="blog-post-shell mb-12">
        <h1 className="section-title blog-post-title">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {[post.date, post.readingTime].filter(Boolean).join(" • ")}
        </p>

        <article className="mt-14">
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
  );
}
