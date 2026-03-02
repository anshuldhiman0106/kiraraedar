"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart, LayoutDashboard, LogOutIcon, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"

type ProfileMenuProps = {
  isLightTheme: boolean
  onToggleTheme: () => void
  onOpenFavorites: () => void
  onOpenDashboard: () => void
  onLogout: () => Promise<void>
}

export function HeaderActions({ isLightTheme, onToggleTheme, onOpenFavorites, onOpenDashboard, onLogout }: ProfileMenuProps) {
  const [displayName, setDisplayName] = useState("Guest User")
  const [displayEmail, setDisplayEmail] = useState("")
  const [profilePhoto, setProfilePhoto] = useState("")

  const initials = useMemo(() => {
    const text = displayName.trim()
    if (!text) return "U"
    return text
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
  }, [displayName])

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setDisplayName("Guest User")
        setDisplayEmail("")
        setProfilePhoto("")
        return
      }

      setDisplayEmail(user.email ?? "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, profile_photo")
        .eq("id", user.id)
        .single()

      setDisplayName(profile?.full_name?.trim() || user.email?.split("@")[0] || "User")
      setProfilePhoto(profile?.profile_photo || "")
    }

    void loadProfile()
  }, [])

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-full border border-border/60 bg-card px-1.5 pr-2 hover:bg-accent"
          >
            <Avatar size="sm" className="size-7">
              <AvatarImage src={profilePhoto} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="ml-2 hidden max-w-[130px] truncate text-sm font-medium md:inline">
              {displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 min-w-72 rounded-xl border border-border/60 p-2">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-2.5 py-2">
            <Avatar size="default">
              <AvatarImage src={profilePhoto} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              {displayEmail ? (
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Manage your account</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenFavorites}>
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenDashboard}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
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
