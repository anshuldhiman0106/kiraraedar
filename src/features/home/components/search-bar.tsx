"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchBarProps = {
  value: string
  onValueChange: (value: string) => void
  onSubmit?: () => void
}

export function SearchBar({ value, onValueChange, onSubmit }: SearchBarProps) {
  return (
    <div className="sm:w-full max-w-5xl mx-auto">
      <div className="flex items-center rounded-full border border-border shadow-md px-2 py-2">
        <div className="flex-1 px-6 gap-2 cursor-text">
          <div className="text-xs font-medium text-foreground">Where</div>
          <Input
            placeholder="Search McLeod Ganj, Shyam Nagar, Ram Nagar..."
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit?.()
              }
            }}
            className="h-auto border-none text-lg font-semibold focus-visible:ring-0 dark:bg-input-transparent p-0"
          />
        </div>
        <Button
          size="icon"
          type="button"
          onClick={onSubmit}
          className="ml-2 h-15 w-15 rounded-full text-white shadow-md bg-gradient-to-r from-primary to-primary/90"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
