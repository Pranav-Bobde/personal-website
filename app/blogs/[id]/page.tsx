import { getBlogPost, getBlogPosts } from "@/lib/blog-data"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface BlogPostPageProps {
  params: Promise<{
    id: string
  }>
}

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ id: post.id }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = getBlogPost(id)

  if (!post) {
    return {
      title: "Blog Post Not Found",
    }
  }

  return {
    title: post.title,
    description: post.summary,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params
  const post = getBlogPost(id)

  if (!post) {
    notFound()
  }

  // Convert markdown-like content to HTML
  const contentHtml = post.content
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, '</p><p class="my-4">')
    .replace(
      /```(.+?)\n([\s\S]*?)```/g,
      '<pre class="bg-secondary p-4 rounded-md my-4 overflow-x-auto"><code class="text-sm">$2</code></pre>',
    )
    .replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" class="text-accent hover:underline">$1</a>')
    .replace(/^\* (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
    .replace(/<\/li>\n<li/g, "</li><li")

  return (
    <div className="animate-fade-in">
      <div className="mb-12 blog-post-shell">
        <h1 className="section-title blog-post-title">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {[post.date, post.readingTime].filter(Boolean).join(" • ")}
        </p>

        <article className="mt-14">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="my-4">${contentHtml}</p>` }}
          />
        </article>

        <div className="mt-12 pt-4 border-t border-muted">
          <Link
            href="/blogs"
            className="flex items-center text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to all posts
          </Link>
        </div>
      </div>
    </div>
  )
}
