import { useEffect, useRef } from "react";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  placeholder = "Type to search...",
}: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(focusId);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[20vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-md border border-border bg-background p-4 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center border-b pb-4">
          <span className="mr-2 text-muted-foreground">/</span>
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
