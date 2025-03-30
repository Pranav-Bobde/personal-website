"use client"

import { projects } from "@/lib/project-data"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { SearchDialog } from "@/components/search-dialog"
import { ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

export default function ProjectsPage() {
  const [filteredProjects, setFilteredProjects] = useState(projects)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering client-side content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const { activeIndex, isSearchOpen, searchQuery, setSearchQuery, setIsSearchOpen } = useKeyboardNavigation({
    itemSelector: ".project-item",
    onEnter: (element) => {
      const href = element.getAttribute("data-href")
      if (href) window.open(href, "_blank")
    },
  })

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.technologies.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredProjects(filtered)
    } else {
      setFilteredProjects(projects)
    }
  }, [searchQuery])

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title">projects</h1>
          <p className="text-sm text-muted-foreground mb-6">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">projects</h1>
        <p className="text-sm text-muted-foreground mb-6">
          press <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">/</kbd> to search • use{" "}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">ctrl + j/k</kbd> or
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">↑</kbd> and
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">↓</kbd> to navigate
        </p>

        <p className="mb-8 text-muted-foreground">
          Here are some of the projects I've worked on. I love building tools that solve real problems and exploring new
          technologies along the way.
        </p>

        <div className="space-y-8">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className={`project-item entry-item ${activeIndex === index ? "ring-2 ring-accent" : ""}`}
                tabIndex={0}
                data-href={project.link}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{project.title}</h2>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  {project.role} ({project.period})
                </div>

                <p className="my-3">{project.description}</p>

                {project.achievements.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold mb-2">Achievements</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {project.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No projects found matching your search.</p>
          )}
        </div>
      </div>

      <SearchDialog
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search projects..."
      />
    </div>
  )
}

