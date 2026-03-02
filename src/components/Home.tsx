"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Filter, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { HeaderActions } from "@/features/home/components/profile-menu"
import { SearchBar } from "@/features/home/components/search-bar"
import { ListingCard } from "@/features/home/components/listing-card"
import { fetchAvailableProperties } from "@/features/home/services"
import type { Property } from "@/features/home/types"

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const data = await fetchAvailableProperties(12)
        setProperties(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load properties")
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(`Error logging out: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen ">
      <header className="sticky bg-card/95 top-0 z-50 backdrop-blur-xl shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="logo.svg" alt="Kiraedar Logo" className="w-10 h-10" />
              </div>
              <div className="px-1 hidden lg:block">
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text">
                  Kiraedar
                </h1>
              </div>
            </div>

            <div className="hidden lg:block">
              <SearchBar />
            </div>

            <HeaderActions
              isLightTheme={theme === "light"}
              onOpenDashboard={() => router.push("/user_dashboard")}
              onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
              onLogout={handleLogout}
            />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-none border-t border-border shadow-lg"
            >
              <SearchBar />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-20 lg:mb-32">
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent mb-6 leading-tight drop-shadow-2xl">
            Find your perfect room
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 lg:mb-16 leading-relaxed">
            Discover {properties.length} verified rooms in Dharamshala at unbeatable prices
          </p>
        </div>

        <div className="mb-10 lg:mb-20 space-y-4 lg:space-y-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">{properties.length} rooms</h2>
              <Separator orientation="vertical" className="hidden sm:block h-6 bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Sort by:</span>
                <Select defaultValue="newest">
                  <SelectTrigger className="h-10 rounded-xl border-border/50 bg-card px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card">
                Map
              </Button>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl bg-card border-border/50" />
              </Sheet>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-8">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`skeleton-${i}`} className="h-[420px] rounded-2xl bg-muted" />
              ))
            : properties.map((property, index) => <ListingCard key={property.id} property={property} index={index} />)}
        </div>

        <div className="text-center py-20">
          <Button
            size="lg"
            className="h-16 px-16 rounded-2xl text-xl shadow-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600"
          >
            Show more rooms
          </Button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50" onClick={() => setSearchOpen(!searchOpen)}>
        <Button className="h-16 w-16 rounded-3xl shadow-2xl p-0 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600">
          <Search className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
