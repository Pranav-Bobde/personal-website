import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { SearchDialog } from "@/components/search-dialog";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { projects } from "@/lib/project-data";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { activeIndex, isSearchOpen, searchQuery, setSearchQuery, setIsSearchOpen } =
    useKeyboardNavigation({
      itemSelector: ".project-item",
      onEnter: (element) => {
        const href = element.getAttribute("data-href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      },
    });

  useEffect(() => {
    if (searchQuery) {
      const nextFilteredProjects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.technologies.some((tech) =>
            tech.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
      setFilteredProjects(nextFilteredProjects);
      return;
    }

    setFilteredProjects(projects);
  }, [searchQuery]);

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title">projects</h1>
          <p className="mb-6 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">projects</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          press <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">/</kbd> to search • use{" "}
          <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">ctrl + j/k</kbd> or
          <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">↑</kbd> and
          <kbd className="bg-secondary px-1 py-0.5 text-xs rounded">↓</kbd> to navigate
        </p>

        <p className="mb-8 text-muted-foreground">
          Here are some of the projects I've worked on. I love building tools that solve real
          problems and exploring new technologies along the way.
        </p>

        <div className="space-y-8">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className={`project-item entry-item ${activeIndex === index ? "ring-accent ring-2" : ""}`}
                tabIndex={0}
                data-href={project.link}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{project.title}</h2>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent text-muted-foreground"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {project.role} ({project.period})
                </div>

                <p className="my-3">{project.description}</p>

                {project.achievements.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-bold">Achievements</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {project.achievements.map((achievement) => (
                        <li key={achievement}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {project.technologies.length > 0 ? (
                  <div className="mt-4 flex flex-wrap">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
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
  );
}
