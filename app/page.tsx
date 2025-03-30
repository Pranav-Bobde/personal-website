"use client"

import { siteConfig } from "@/lib/config"
import Link from "next/link"
import { MapPin, Briefcase } from "lucide-react"
import { useEffect } from "react"

export default function Home() {
  // Handle keyboard navigation for social links
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input elements are focused
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return
      }

      // Open social links in new tabs with single key press
      Object.entries(siteConfig.social).forEach(([key, url]) => {
        if (e.key.toLowerCase() === key.charAt(0).toLowerCase()) {
          e.preventDefault()
          window.open(key === "email" ? `mailto:${url}` : url, "_blank")
        }
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold">{siteConfig.name}</h1>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground"
          style={{ animationDelay: "100ms" }}
        >
          <MapPin size={16} />
          <span>{siteConfig.location}</span>
        </div>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground"
          style={{ animationDelay: "200ms" }}
        >
          <Briefcase size={16} />
          <span>{siteConfig.title}</span>
        </div>

        <div className="space-y-4" style={{ animationDelay: "300ms" }}>
          <p className="text-muted-foreground">
            {siteConfig.bio.main}
          </p>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">{siteConfig.bio.secondaryTitle}</h3>
            <p className="text-muted-foreground">
              {siteConfig.bio.secondary}
            </p>
          </div>
        </div>

        {/* Always show social links section */}
        <div className="pt-8" style={{ animationDelay: "400ms" }}>
          <h2 className="section-title">links</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(siteConfig.social).map(([key, url], index) => {
              // Assign shortcut keys based on the first letter of each platform
              const shortcutKey = key.charAt(0);
              return (
                <Link
                  key={key}
                  href={key === "email" ? `mailto:${url}` : url}
                  className="hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  [{shortcutKey}] {key}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

