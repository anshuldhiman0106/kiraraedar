"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/features/home/components/listing-card"
import { fetchPropertiesByIds } from "@/features/home/services"
import type { Property } from "@/features/home/types"

const FAVORITES_STORAGE_KEY = "favoriteProperties"

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const rawFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!rawFavorites) {
      setFavoriteIds([])
      setLoading(false)
      return
    }

    try {
      const parsedFavorites = JSON.parse(rawFavorites)
      if (Array.isArray(parsedFavorites)) {
        setFavoriteIds(parsedFavorites.filter((id): id is string => typeof id === "string"))
      } else {
        setFavoriteIds([])
      }
    } catch {
      localStorage.removeItem(FAVORITES_STORAGE_KEY)
      setFavoriteIds([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadFavoriteProperties = async () => {
      if (!favoriteIds.length) {
        setProperties([])
        return
      }

      try {
        const data = await fetchPropertiesByIds(favoriteIds)
        setProperties(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load favorite properties")
      }
    }

    if (!loading) {
      loadFavoriteProperties()
    }
  }, [favoriteIds, loading])

  const handleToggleFavorite = (propertyId: string) => {
    setFavoriteIds((currentFavoriteIds) => {
      const nextFavoriteIds = currentFavoriteIds.filter((id) => id !== propertyId)
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavoriteIds))
      return nextFavoriteIds
    })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky bg-card/95 top-0 z-50 backdrop-blur-xl shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">My Favorites</h1>
            <p className="text-sm text-muted-foreground">{properties.length} saved properties</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!loading && !properties.length ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">Save properties from the home page to see them here.</p>
            <Button onClick={() => router.push("/")}>Browse Properties</Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 lg:gap-6">
            {properties.map((property, index) => (
              <ListingCard
                key={property.id}
                property={property}
                index={index}
                isFavorite={true}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
