import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { siteConfig } from "@/lib/config";

const hotkeyOptions = {
  preventDefault: true,
  stopPropagation: true,
  ignoreInputs: true,
};

export function Navigation() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  useNavigationHotkeys(navigate);

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

function useNavigationHotkeys(navigate: ReturnType<typeof useNavigate>) {
  useHotkey(
    "H",
    () => {
      navigate({ to: "/" });
    },
    {
      ...hotkeyOptions,
      enabled: true,
    },
  );

  useHotkey(
    "B",
    () => {
      if (siteConfig.sections.blogs) {
        navigate({ to: "/blogs" });
      }
    },
    {
      ...hotkeyOptions,
      enabled: siteConfig.sections.blogs,
    },
  );

  useHotkey(
    "P",
    () => {
      if (siteConfig.sections.projects) {
        navigate({ to: "/projects" });
      }
    },
    {
      ...hotkeyOptions,
      enabled: siteConfig.sections.projects,
    },
  );
}
