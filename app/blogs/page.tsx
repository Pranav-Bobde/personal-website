import { BlogsClient } from "./blogs-client"
import { getBlogPosts } from "@/lib/blog-data"

export default function BlogsPage() {
  const posts = getBlogPosts()

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">blog</h1>
        {posts.length > 0 && (
          <p className="text-sm text-muted-foreground mb-8">
            use <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">j/k</kbd> or{" "}
            <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">↑/↓</kbd> for entries •{" "}
            <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">h/l</kbd> or{" "}
            <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">←/→</kbd> for pages
          </p>
        )}
        <BlogsClient posts={posts} />
      </div>
    </div>
  )
}
