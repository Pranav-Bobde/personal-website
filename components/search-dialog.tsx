"use client"

import { useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface SearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchChange,
  placeholder = "Type to search...",
}: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center border-b pb-4">
          <span className="text-muted-foreground mr-2">/</span>
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

