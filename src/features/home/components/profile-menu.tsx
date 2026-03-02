"use client"

import { Globe, Heart, LogOutIcon, MessageCircle, Moon, Sun, User, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ProfileMenuProps = {
  isLightTheme: boolean
  onToggleTheme: () => void
  onOpenDashboard: () => void
  onLogout: () => Promise<void>
}

export function HeaderActions({ isLightTheme, onToggleTheme, onOpenDashboard, onLogout }: ProfileMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
        <Globe className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
            <User className="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenDashboard}>
            <UserIcon className="h-4 w-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleTheme}>
            {isLightTheme ? (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Dark mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Light mode
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <LogOutIcon className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
