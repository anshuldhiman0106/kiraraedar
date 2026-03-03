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
      <div className="flex items-center rounded-full border border-border bg-card shadow-md px-3 py-2.5">
        <div className="flex-1 px-6 gap-2 cursor-text">
          <div className="text-sm font-semibold text-foreground">Where</div>
          <Input
            placeholder="Search McLeod Ganj, Shyam Nagar, Ram Nagar..."
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit?.()
              }
            }}
            className="h-auto border-none bg-transparent p-0 text-xl font-semibold focus-visible:ring-0 dark:bg-input-transparent"
          />
        </div>
        <Button
          size="icon"
          type="button"
          onClick={onSubmit}
          className="ml-2 h-14 w-14 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white shadow-md"
        >
          <Search className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
