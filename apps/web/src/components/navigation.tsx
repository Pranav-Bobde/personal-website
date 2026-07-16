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
      <HomeNavItem pathname={pathname} />
      <HireMeNavItem pathname={pathname} />
      <BlogNavItem pathname={pathname} />
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
      navigate({ to: "/hire-me" });
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
}

function HomeNavItem({ pathname }: { pathname: string }) {
  return (
    <Link to="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
      [h] home
    </Link>
  );
}

function HireMeNavItem({ pathname }: { pathname: string }) {
  return (
    <Link to="/hire-me" className={`nav-item ${pathname === "/hire-me" ? "active" : ""}`}>
      [m] hire me
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
