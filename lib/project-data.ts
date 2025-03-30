export interface Project {
  id: string
  title: string
  description: string
  role: string
  period: string
  link: string
  achievements: string[]
  technologies: string[]
}

export const projects: Project[] = [
  {
    id: "portfolio-site",
    title: "Portfolio Site",
    description: "A minimal, keyboard-navigable personal website built with Next.js and Tailwind CSS.",
    role: "Developer",
    period: "Mar 2024 - Present",
    link: "https://github.com/username/portfolio",
    achievements: [
      "Implemented keyboard navigation for improved accessibility",
      "Created a responsive design that works on all devices",
      "Optimized for performance with 100/100 Lighthouse score",
    ],
    technologies: ["next.js", "typescript", "tailwind css", "shadcn/ui"],
  },
  {
    id: "task-manager",
    title: "Task Manager",
    description: "A productivity app for managing tasks with advanced filtering and sorting capabilities.",
    role: "Lead Developer",
    period: "Jan 2024 - Feb 2024",
    link: "https://github.com/username/task-manager",
    achievements: [
      "Built a drag-and-drop interface for task organization",
      "Implemented real-time updates using WebSockets",
      "Added offline support with service workers",
    ],
    technologies: ["react", "typescript", "node.js", "mongodb"],
  },
  {
    id: "code-editor",
    title: "Code Editor",
    description: "A lightweight browser-based code editor with syntax highlighting and live preview.",
    role: "Creator",
    period: "Nov 2023 - Dec 2023",
    link: "https://github.com/username/code-editor",
    achievements: [
      "Implemented syntax highlighting for multiple languages",
      "Added real-time preview for HTML, CSS, and JavaScript",
      "Created a plugin system for extensibility",
    ],
    technologies: ["javascript", "codemirror", "webpack"],
  },
]

