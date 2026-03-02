"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bed, Heart, MapPin, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { Property } from "../types"
import { PropertyCarousel } from "./property-carousel"

type ListingCardProps = {
  property: Property
  index: number
  isFavorite: boolean
  onToggleFavorite: (propertyId: string) => void
}

export function ListingCard({ property, index, isFavorite, onToggleFavorite }: ListingCardProps) {
  const router = useRouter()
  const [renderTimestamp] = useState(() => Date.now())

  const isNewProperty = property.created_at
    ? renderTimestamp - new Date(property.created_at).getTime() < 172800000
    : false

  const handleCardClick = () => {
    router.push(`/detail/${property.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card
        onClick={handleCardClick}
        className="relative w-full aspect-square overflow-hidden hover:shadow-2xl hover:shadow-neutral-800/50 hover:-translate-y-2 transition-all duration-500 border-0 bg-card shadow-lg border-border/50 cursor-pointer p-0"
      >
        <PropertyCarousel isNewProperty={isNewProperty} images={property.images || []} />

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 z-20 h-11 w-11 rounded-full bg-card/95 hover:bg-card backdrop-blur-sm shadow-lg border-border/50"
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite(property.id)
          }}
          aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-primary"
            }`}
          />
        </Button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 pt-14 opacity-100 group-hover:opacity-0 transition-opacity duration-300 text-white bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/45 px-2.5 py-1">
              {property.owner?.profile_photo ? (
                <img
                  src={property.owner.profile_photo}
                  alt={property.owner.full_name || "Owner"}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-semibold">
                  {(property.owner?.full_name?.[0] || "O").toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium line-clamp-1">{property.owner?.full_name || "Owner"}</span>
            </div>
            {property.owner?.verified_landlord && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 px-2 py-1 text-[10px] font-semibold">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </div>
            )}
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-white/20 text-white border-white/30">
              {property.capacity?.toUpperCase()} - {property.gender?.toUpperCase()}
            </Badge>
            {property.furnished && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-emerald-500/70 text-white border-emerald-300/50">
                Furnished
              </Badge>
            )}
          </div>

          <CardTitle className="text-lg font-bold leading-tight line-clamp-1 text-white">{property.title}</CardTitle>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-white/90">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">
              {property.area || "Dharamshala"} - {property.address.split(",")[0]}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {property.capacity === "single" ? "1 bed" : property.capacity === "duo" ? "2 beds" : "3 beds"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {property.capacity === "single" ? "1" : property.capacity === "duo" ? "2" : "3"} guests
              </span>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-white">Rs {property.rent}</div>
              <div>month</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
