import { useHotkey } from "@tanstack/react-hotkeys";
import type { Dispatch, SetStateAction } from "react";
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

function getNextIndex(index: number, totalItems: number) {
  return index + 1 >= totalItems ? 0 : index + 1;
}

function getPreviousIndex(index: number, totalItems: number) {
  return index - 1 < 0 ? totalItems - 1 : index - 1;
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
      ignoreInputs: true,
      enabled: !isSearchOpen,
    }),
    [isSearchOpen],
  );

  useDirectionalHotkey("J", itemSelector, options, getNextIndex, setActiveIndex);
  useDirectionalHotkey("ArrowDown", itemSelector, options, getNextIndex, setActiveIndex);
  useDirectionalHotkey("K", itemSelector, options, getPreviousIndex, setActiveIndex);
  useDirectionalHotkey("ArrowUp", itemSelector, options, getPreviousIndex, setActiveIndex);

  useHotkey(
    "Control+H",
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
    "Control+L",
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

function useDirectionalHotkey(
  key: Parameters<typeof useHotkey>[0],
  itemSelector: string,
  options: Parameters<typeof useHotkey>[2],
  getTargetIndex: (index: number, totalItems: number) => number,
  setActiveIndex: Dispatch<SetStateAction<number>>,
) {
  useHotkey(
    key,
    () => {
      const items = getFocusableItems(itemSelector);
      if (items.length === 0) {
        return;
      }

      setActiveIndex((currentIndex) => {
        const nextIndex = getTargetIndex(currentIndex, items.length);
        items[nextIndex]?.focus();
        return nextIndex;
      });
    },
    options,
  );
}
