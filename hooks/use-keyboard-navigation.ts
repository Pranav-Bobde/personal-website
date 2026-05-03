"use client"

import { useEffect, useState } from "react"

interface KeyboardNavigationOptions {
  itemSelector: string
  onEnter?: (element: HTMLElement) => void
  onPreviousPage?: () => void
  onNextPage?: () => void
  searchEnabled?: boolean
}

export function useKeyboardNavigation({
  itemSelector,
  onEnter,
  onPreviousPage,
  onNextPage,
  searchEnabled = true,
}: KeyboardNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if an input is focused
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return
      }

      const items = document.querySelectorAll<HTMLElement>(itemSelector)

      // Search functionality
      if (e.key === "/" && searchEnabled && !isSearchOpen) {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }

      // Close search on Escape
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault()
        setIsSearchOpen(false)
        setSearchQuery("")
        return
      }

      // Handle search input
      if (isSearchOpen) {
        return
      }

      // Navigation between items
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev + 1 >= items.length ? 0 : prev + 1
          items[next]?.focus()
          return next
        })
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev - 1 < 0 ? items.length - 1 : prev - 1
          items[next]?.focus()
          return next
        })
      } else if (e.key === "h" || e.key === "ArrowLeft") {
        e.preventDefault()
        onPreviousPage?.()
        setActiveIndex(-1)
      } else if (e.key === "l" || e.key === "ArrowRight") {
        e.preventDefault()
        onNextPage?.()
        setActiveIndex(-1)
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault()
        onEnter?.(items[activeIndex])
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [itemSelector, activeIndex, isSearchOpen, onEnter, onNextPage, onPreviousPage, searchEnabled])

  return {
    activeIndex,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    setIsSearchOpen,
  }
}
