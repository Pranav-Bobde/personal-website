import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useMemo, useState } from "react";

interface KeyboardNavigationOptions {
  itemSelector: string;
  onEnter?: (element: HTMLElement) => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  searchEnabled?: boolean;
}

function getFocusableItems(itemSelector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(itemSelector));
}

export function useKeyboardNavigation({
  itemSelector,
  onEnter,
  onPreviousPage,
  onNextPage,
  searchEnabled = true,
}: KeyboardNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const options = useMemo(
    () => ({
      preventDefault: true,
      stopPropagation: true,
      ignoreInputElements: true,
      enabled: !isSearchOpen,
    }),
    [isSearchOpen],
  );

  useHotkey(
    "j",
    () => {
      const items = getFocusableItems(itemSelector);
      if (items.length === 0) {
        return;
      }

      setActiveIndex((prev) => {
        const next = prev + 1 >= items.length ? 0 : prev + 1;
        items[next]?.focus();
        return next;
      });
    },
    options,
  );

  useHotkey(
    "ArrowDown",
    () => {
      const items = getFocusableItems(itemSelector);
      if (items.length === 0) {
        return;
      }

      setActiveIndex((prev) => {
        const next = prev + 1 >= items.length ? 0 : prev + 1;
        items[next]?.focus();
        return next;
      });
    },
    options,
  );

  useHotkey(
    "k",
    () => {
      const items = getFocusableItems(itemSelector);
      if (items.length === 0) {
        return;
      }

      setActiveIndex((prev) => {
        const next = prev - 1 < 0 ? items.length - 1 : prev - 1;
        items[next]?.focus();
        return next;
      });
    },
    options,
  );

  useHotkey(
    "ArrowUp",
    () => {
      const items = getFocusableItems(itemSelector);
      if (items.length === 0) {
        return;
      }

      setActiveIndex((prev) => {
        const next = prev - 1 < 0 ? items.length - 1 : prev - 1;
        items[next]?.focus();
        return next;
      });
    },
    options,
  );

  useHotkey(
    "ctrl+h",
    () => {
      onPreviousPage?.();
      setActiveIndex(-1);
    },
    {
      ...options,
      enabled: !isSearchOpen && Boolean(onPreviousPage),
    },
  );

  useHotkey(
    "ArrowLeft",
    () => {
      onPreviousPage?.();
      setActiveIndex(-1);
    },
    {
      ...options,
      enabled: !isSearchOpen && Boolean(onPreviousPage),
    },
  );

  useHotkey(
    "ctrl+l",
    () => {
      onNextPage?.();
      setActiveIndex(-1);
    },
    {
      ...options,
      enabled: !isSearchOpen && Boolean(onNextPage),
    },
  );

  useHotkey(
    "ArrowRight",
    () => {
      onNextPage?.();
      setActiveIndex(-1);
    },
    {
      ...options,
      enabled: !isSearchOpen && Boolean(onNextPage),
    },
  );

  useHotkey(
    "Enter",
    () => {
      const items = getFocusableItems(itemSelector);
      if (activeIndex >= 0 && items[activeIndex]) {
        onEnter?.(items[activeIndex]);
      }
    },
    {
      ...options,
      enabled: !isSearchOpen && activeIndex >= 0,
    },
  );

  useHotkey(
    "/",
    () => {
      if (searchEnabled && !isSearchOpen) {
        setIsSearchOpen(true);
      }
    },
    {
      ...options,
      enabled: searchEnabled && !isSearchOpen,
    },
  );

  useHotkey(
    "Escape",
    () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    },
    {
      ...options,
      enabled: isSearchOpen,
    },
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [itemSelector, searchQuery]);

  return {
    activeIndex,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    setIsSearchOpen,
  };
}
