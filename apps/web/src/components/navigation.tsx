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
    <nav className="mb-8 flex justify-start gap-x-3 overflow-x-auto whitespace-nowrap sm:justify-center sm:gap-x-6 text-sm">
      <HomeNavItem pathname={pathname} />
      <WorkNavItem pathname={pathname} />
      <BlogNavItem pathname={pathname} />
      <ProjectsNavItem pathname={pathname} />
      <NewsletterNavItem pathname={pathname} />
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
    "M",
    () => {
      navigate({ to: "/work" });
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

  useHotkey(
    "N",
    () => {
      if (siteConfig.sections.newsletter) {
        navigate({ to: "/newsletter" });
      }
    },
    {
      ...hotkeyOptions,
      enabled: siteConfig.sections.newsletter,
    },
  );
}

function ProjectsNavItem({ pathname }: { pathname: string }) {
  if (!siteConfig.sections.projects) {
    return null;
  }

  return (
    <Link to="/projects" className={`nav-item ${pathname === "/projects" ? "active" : ""}`}>
      [p] projects
    </Link>
  );
}

function HomeNavItem({ pathname }: { pathname: string }) {
  return (
    <Link to="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
      [h] home
    </Link>
  );
}

function WorkNavItem({ pathname }: { pathname: string }) {
  return (
    <Link to="/work" className={`nav-item ${pathname.startsWith("/work") ? "active" : ""}`}>
      [m] work
    </Link>
  );
}

function BlogNavItem({ pathname }: { pathname: string }) {
  if (!siteConfig.sections.blogs) {
    return null;
  }

  return (
    <Link to="/blogs" className={`nav-item ${pathname.startsWith("/blogs") ? "active" : ""}`}>
      [b] blog
    </Link>
  );
}

function NewsletterNavItem({ pathname }: { pathname: string }) {
  if (!siteConfig.sections.newsletter) {
    return null;
  }

  return (
    <Link to="/newsletter" className={`nav-item ${pathname === "/newsletter" ? "active" : ""}`}>
      [n] newsletter
    </Link>
  );
}
