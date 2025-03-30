"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input elements are focused
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return
      }

      // Navigation between sections with single key press (no Ctrl needed)
      if (e.key === "h") {
        e.preventDefault()
        router.push("/")
      } else if (e.key === "b" && siteConfig.sections.blogs) {
        e.preventDefault()
        router.push("/blogs")
      } else if (e.key === "p" && siteConfig.sections.projects) {
        e.preventDefault()
        router.push("/projects")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return (
    <nav className="flex justify-center space-x-6 mb-8 text-sm">
      <Link href="/" className={cn("nav-item", pathname === "/" && "active")}>
        [h] home
      </Link>

      {siteConfig.sections.blogs && (
        <Link href="/blogs" className={cn("nav-item", pathname.startsWith("/blogs") && "active")}>
          [b] blog
        </Link>
      )}

      {siteConfig.sections.projects && (
        <Link href="/projects" className={cn("nav-item", pathname.startsWith("/projects") && "active")}>
          [p] projects
        </Link>
      )}
    </nav>
  )
}

