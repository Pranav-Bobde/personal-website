import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { siteConfig } from "@/lib/config";

export function Navigation() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  useHotkey(
    "h",
    () => {
      navigate({ to: "/" });
    },
    {
      preventDefault: true,
      stopPropagation: true,
      ignoreInputElements: true,
      enabled: true,
    },
  );

  useHotkey(
    "b",
    () => {
      if (siteConfig.sections.blogs) {
        navigate({ to: "/blogs" });
      }
    },
    {
      preventDefault: true,
      stopPropagation: true,
      ignoreInputElements: true,
      enabled: siteConfig.sections.blogs,
    },
  );

  useHotkey(
    "p",
    () => {
      if (siteConfig.sections.projects) {
        navigate({ to: "/projects" });
      }
    },
    {
      preventDefault: true,
      stopPropagation: true,
      ignoreInputElements: true,
      enabled: siteConfig.sections.projects,
    },
  );

  return (
    <nav className="mb-8 flex justify-center space-x-6 text-sm">
      <Link to="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
        [h] home
      </Link>

      {siteConfig.sections.blogs ? (
        <Link to="/blogs" className={`nav-item ${pathname.startsWith("/blogs") ? "active" : ""}`}>
          [b] blog
        </Link>
      ) : null}

      {siteConfig.sections.projects ? (
        <Link
          to="/projects"
          className={`nav-item ${pathname.startsWith("/projects") ? "active" : ""}`}
        >
          [p] projects
        </Link>
      ) : null}
    </nav>
  );
}
