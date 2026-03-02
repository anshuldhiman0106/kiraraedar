"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Filter, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { MapSearchPanel } from "@/features/home/components/map-search-panel"
import { HeaderActions } from "@/features/home/components/profile-menu"
import { SearchBar } from "@/features/home/components/search-bar"
import { ListingCard } from "@/features/home/components/listing-card"
import { fetchAvailableProperties, fetchAvailablePropertiesCount, fetchPropertiesInBounds } from "@/features/home/services"
import type { Property } from "@/features/home/types"
import type { MapBounds } from "@/features/home/components/map-canvas"

export default function HomePage() {
  const PAGE_SIZE = 12
  const [properties, setProperties] = useState<Property[]>([])
  const [totalAvailableCount, setTotalAvailableCount] = useState<number | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedArea, setSelectedArea] = useState("all")
  const [selectedGender, setSelectedGender] = useState("all")
  const [selectedCapacity, setSelectedCapacity] = useState("all")
  const [furnishedOnly, setFurnishedOnly] = useState(false)
  const [nearCollegeOnly, setNearCollegeOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mapAppliedBounds, setMapAppliedBounds] = useState<MapBounds | null>(null)
  const [mapLiveProperties, setMapLiveProperties] = useState<Property[]>([])
  const mapFetchTimeoutRef = useRef<number | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const loadPropertiesPage = useCallback(async (page: number, replace = false) => {
    const offset = page * PAGE_SIZE
    const data = await fetchAvailableProperties(PAGE_SIZE, offset)

    if (replace) {
      setProperties(data)
    } else {
      setProperties((currentProperties) => [...currentProperties, ...data])
    }

    setHasMore(data.length === PAGE_SIZE)
    setCurrentPage(page)
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) {
      return
    }

    setLoadingMore(true)
    try {
      await loadPropertiesPage(currentPage + 1)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load more properties")
    } finally {
      setLoadingMore(false)
    }
  }, [currentPage, hasMore, loadPropertiesPage, loading, loadingMore])

  useEffect(() => {
    const loadInitialProperties = async () => {
      try {
        setLoading(true)
        const [count] = await Promise.all([
          fetchAvailablePropertiesCount(),
          loadPropertiesPage(0, true),
        ])
        setTotalAvailableCount(count)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load properties")
      } finally {
        setLoading(false)
      }
    }

    loadInitialProperties()
  }, [loadPropertiesPage])

  useEffect(() => {
    const syncPropertyById = async (propertyId: string) => {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
            *,
            owner:profiles!properties_owner_id_fkey(full_name, profile_photo, verified_landlord),
            views,
            inquiries
          `,
        )
        .eq("id", propertyId)
        .eq("available", true)
        .maybeSingle()

      if (error) {
        console.error(error)
        return
      }

      setProperties((currentProperties) => {
        const exists = currentProperties.some((property) => property.id === propertyId)

        if (!data) {
          return currentProperties.filter((property) => property.id !== propertyId)
        }

        if (!exists) {
          return [data as Property, ...currentProperties]
        }

        return currentProperties.map((property) =>
          property.id === propertyId ? ({ ...property, ...(data as Property) }) : property,
        )
      })
    }

    const channel = supabase
      .channel("home-properties-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "properties",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id
            if (!deletedId) {
              return
            }

            setProperties((currentProperties) =>
              currentProperties.filter((property) => property.id !== deletedId),
            )
            return
          }

          const nextId = (payload.new as { id?: string })?.id
          if (!nextId) {
            return
          }

          void syncPropertyById(nextId)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      searchQuery.trim().length > 0 ||
      selectedArea !== "all" ||
      selectedGender !== "all" ||
      selectedCapacity !== "all" ||
      furnishedOnly ||
      nearCollegeOnly ||
      !!mapAppliedBounds,
    [furnishedOnly, mapAppliedBounds, nearCollegeOnly, searchQuery, selectedArea, selectedCapacity, selectedGender],
  )

  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          void handleLoadMore()
        }
      },
      { rootMargin: "250px" },
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [handleLoadMore, hasMore, loading, loadingMore])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches)

    updateDesktopState()
    mediaQuery.addEventListener("change", updateDesktopState)

    return () => {
      mediaQuery.removeEventListener("change", updateDesktopState)
    }
  }, [])

  useEffect(() => {
    const rawFavorites = localStorage.getItem("favoriteProperties")
    if (!rawFavorites) {
      return
    }

    try {
      const parsedFavorites = JSON.parse(rawFavorites)
      if (Array.isArray(parsedFavorites)) {
        setFavoriteIds(parsedFavorites.filter((id): id is string => typeof id === "string"))
      }
    } catch {
      localStorage.removeItem("favoriteProperties")
    }
  }, [])

  useEffect(() => {
    return () => {
      if (mapFetchTimeoutRef.current) {
        window.clearTimeout(mapFetchTimeoutRef.current)
      }
    }
  }, [])

  const handleToggleFavorite = (propertyId: string) => {
    setFavoriteIds((currentFavoriteIds) => {
      const nextFavoriteIds = currentFavoriteIds.includes(propertyId)
        ? currentFavoriteIds.filter((id) => id !== propertyId)
        : [...currentFavoriteIds, propertyId]

      localStorage.setItem("favoriteProperties", JSON.stringify(nextFavoriteIds))
      return nextFavoriteIds
    })
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(`Error logging out: ${error.message}`)
    }
  }

  const searchFilteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const visibleProperties = properties.filter((property) => {
      const matchesQuery =
        !query ||
        property.title.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        (property.area ?? "").toLowerCase().includes(query)

      const matchesArea = selectedArea === "all" || property.area === selectedArea
      const matchesGender = selectedGender === "all" || property.gender === selectedGender
      const matchesCapacity = selectedCapacity === "all" || property.capacity === selectedCapacity
      const matchesFurnished = !furnishedOnly || !!property.furnished
      const matchesNearCollege = !nearCollegeOnly || !!property.near_college

      return matchesQuery && matchesArea && matchesGender && matchesCapacity && matchesFurnished && matchesNearCollege
    })

    return visibleProperties.sort((a, b) => {
      if (sortBy === "price-low") {
        return a.rent - b.rent
      }

      if (sortBy === "price-high") {
        return b.rent - a.rent
      }

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
  }, [furnishedOnly, nearCollegeOnly, properties, searchQuery, selectedArea, selectedCapacity, selectedGender, sortBy])

  const filteredProperties = useMemo(() => {
    const sourceProperties = mapAppliedBounds ? mapLiveProperties : searchFilteredProperties

    if (!mapAppliedBounds) {
      return sourceProperties
    }

    return sourceProperties.filter((property) => {
      if (typeof property.lat !== "number" || typeof property.lng !== "number") {
        return false
      }

      return (
        property.lat <= mapAppliedBounds.north &&
        property.lat >= mapAppliedBounds.south &&
        property.lng <= mapAppliedBounds.east &&
        property.lng >= mapAppliedBounds.west
      )
    })
  }, [mapAppliedBounds, mapLiveProperties, searchFilteredProperties])

  const displayedRoomsCount = !hasActiveFilters && totalAvailableCount !== null
    ? totalAvailableCount
    : filteredProperties.length

  const resetFilters = () => {
    setSelectedArea("all")
    setSelectedGender("all")
    setSelectedCapacity("all")
    setFurnishedOnly(false)
    setNearCollegeOnly(false)
    setSortBy("newest")
  }

  const clearMapAreaSearch = () => {
    setMapAppliedBounds(null)
    setMapLiveProperties([])
  }

  const handleMapBoundsChange = useCallback(
    (bounds: MapBounds) => {
      setMapAppliedBounds(bounds)

      if (mapFetchTimeoutRef.current) {
        window.clearTimeout(mapFetchTimeoutRef.current)
      }

      mapFetchTimeoutRef.current = window.setTimeout(async () => {
        try {
          const data = await fetchPropertiesInBounds(bounds)
          setMapLiveProperties(data)
        } catch (error) {
          console.error(error)
          toast.error("Failed to load map listings")
        }
      }, 220)
    },
    [],
  )

  return (
    <div className="min-h-screen ">
      <header className="sticky bg-card/95 top-0 z-50 backdrop-blur-xl shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="logo.svg" alt="Kiraedar Logo" className="w-10 h-10" />
              </div>
              <div className="px-1  lg:block">
                <h1 className="text-2xl font-semibold  bg-clip-text">
                  Kiraedar
                </h1>
              </div>
            </div>

            <div className="hidden lg:block">
              <SearchBar value={searchQuery} onValueChange={setSearchQuery} />
            </div>

            <HeaderActions
              isLightTheme={theme === "light"}
              onOpenFavorites={() => router.push("/favorites")}
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
              <SearchBar
                value={searchQuery}
                onValueChange={setSearchQuery}
                onSubmit={() => setSearchOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-12 lg:py-20">
        <div className="text-center mb-20 lg:mb-32">
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent mb-6 leading-tight drop-shadow-2xl">
            Find your perfect room
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 lg:mb-16 leading-relaxed">
            Discover {displayedRoomsCount} matching rooms in Dharamshala at unbeatable prices
          </p>
        </div>

        <div className="mb-10 lg:mb-20 space-y-4 lg:space-y-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">{displayedRoomsCount} rooms</h2>
              <Separator orientation="vertical" className="hidden sm:block h-6 bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
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
              <Button
                variant="outline"
                onClick={() => setMapOpen(true)}
                className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card"
              >
                Map
              </Button>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side={isDesktop ? "right" : "bottom"}
                  className={isDesktop ? "bg-card border-border/50" : "rounded-t-3xl bg-card border-border/50"}
                >
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-2 space-y-4">
                    <div className="space-y-2">
                      <Label>Area</Label>
                      <Select value={selectedArea} onValueChange={setSelectedArea}>
                        <SelectTrigger>
                          <SelectValue placeholder="All areas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All areas</SelectItem>
                          <SelectItem value="McLeod Ganj">McLeod Ganj</SelectItem>
                          <SelectItem value="Shyam Nagar">Shyam Nagar</SelectItem>
                          <SelectItem value="Ram Nagar">Ram Nagar</SelectItem>
                          <SelectItem value="Sakoh">Sakoh</SelectItem>
                          <SelectItem value="Education Board">Education Board</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={selectedGender} onValueChange={setSelectedGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any gender</SelectItem>
                          <SelectItem value="girls">Girls</SelectItem>
                          <SelectItem value="boys">Boys</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any capacity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any capacity</SelectItem>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="duo">Duo</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                      <Label htmlFor="furnished-only">Furnished only</Label>
                      <Switch id="furnished-only" checked={furnishedOnly} onCheckedChange={setFurnishedOnly} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                      <Label htmlFor="near-college-only">Near college only</Label>
                      <Switch id="near-college-only" checked={nearCollegeOnly} onCheckedChange={setNearCollegeOnly} />
                    </div>
                  </div>
                  <SheetFooter className="flex-row gap-2">
                    <Button type="button" variant="outline" onClick={resetFilters} className="flex-1">
                      Reset
                    </Button>
                    <SheetClose asChild>
                      <Button type="button" className="flex-1">
                        Apply
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        <Sheet open={mapOpen} onOpenChange={setMapOpen}>
          <SheetContent
            side={isDesktop ? "right" : "bottom"}
            className={
              isDesktop
                ? "bg-card border-border/50 p-0 data-[side=right]:w-screen data-[side=right]:sm:w-[min(900px,100vw)] data-[side=right]:sm:max-w-[min(900px,100vw)]"
                : "bg-card border-border/50 p-0 h-[92vh] rounded-t-2xl"
            }
          >
            <SheetHeader className="border-b border-border/50">
              <SheetTitle>Map Search</SheetTitle>
            </SheetHeader>
            <div
              className={
                isDesktop
                  ? "flex-1 min-h-0 p-2 sm:p-4"
                  : "h-[calc(92vh-150px)] min-h-[320px] p-2"
              }
            >
              <MapSearchPanel
                properties={mapLiveProperties.length ? mapLiveProperties : searchFilteredProperties}
                onBoundsChange={handleMapBoundsChange}
                onOpenProperty={(propertyId) => router.push(`/detail/${propertyId}`)}
                isOpen={mapOpen}
              />
            </div>
            <SheetFooter className="border-t border-border/50 p-2 sm:p-4">
              <Button type="button" variant="outline" onClick={clearMapAreaSearch} className="w-full sm:w-auto">
                Clear Map Area
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Done
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 lg:gap-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`skeleton-${i}`} className="aspect-square rounded-2xl bg-muted" />
              ))
            : filteredProperties.map((property, index) => (
                <ListingCard
                  key={property.id}
                  property={property}
                  index={index}
                  isFavorite={favoriteIds.includes(property.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
        </div>

        <div className="text-center py-20">
          {hasMore ? (
            <Button
              size="lg"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="h-16 px-16 bg-transparent border-2 border-border/50 rounded-full hover:bg-card transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {loadingMore ? "Loading..." : "Show more rooms"}
            </Button>
          ) : (
            <p className="text-muted-foreground">You have reached the end of listings.</p>
          )}
        </div>
        <div ref={loadMoreRef} className="h-2 w-full" />
      </div>

      {!mapOpen && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50" onClick={() => setSearchOpen(!searchOpen)}>
        <Button className="h-16 w-16 rounded-3xl shadow-2xl p-0 ">
          <Search className="h-6 w-6" />
        </Button>
        </div>
      )}
    </div>
  )
}
