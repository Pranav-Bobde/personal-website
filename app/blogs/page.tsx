"use client"

import { blogPosts } from "@/lib/blog-data"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { SearchDialog } from "@/components/search-dialog"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function BlogsPage() {
  const [filteredPosts, setFilteredPosts] = useState(blogPosts)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering client-side content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const { activeIndex, isSearchOpen, searchQuery, setSearchQuery, setIsSearchOpen } = useKeyboardNavigation({
    itemSelector: ".blog-item",
    onEnter: (element) => {
      const href = element.getAttribute("data-href")
      if (href) window.open(href, "_blank")
    },
  })

  useEffect(() => {
    if (searchQuery) {
      const filtered = blogPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.summary.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(blogPosts)
    }
  }, [searchQuery])

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title">blog</h1>
          <p className="text-sm text-muted-foreground mb-6">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">blog</h1>
        <p className="text-sm text-muted-foreground mb-6">
          press <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">/</kbd> to search • use{" "}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">ctrl + j/k</kbd> or
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">↑</kbd> and
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">↓</kbd> to navigate
        </p>

        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <Link key={post.id} href={`/blogs/${post.id}`} passHref>
                <div
                  className={`blog-item entry-item flex justify-between items-start ${activeIndex === index ? "ring-2 ring-accent" : ""}`}
                  tabIndex={0}
                  data-href={`/blogs/${post.id}`}
                >
                  <div>
                    <h2 className="font-medium">{post.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{post.summary}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">{post.date}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground">No blog posts found matching your search.</p>
          )}
        </div>
      </div>

      <SearchDialog
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search blog posts..."
      />
    </div>
  )
}

