"use client"

import { motion } from "framer-motion"
import { Bed, Heart, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import type { Property } from "../types"
import { PropertyCarousel } from "./property-carousel"
import { useRouter } from "next/navigation"

type ListingCardProps = {
  property: Property
  index: number
}

export function ListingCard({ property, index }: ListingCardProps) {
  const router = useRouter()

  const isNewProperty = property.created_at
  ? Date.now() - new Date(property.created_at).getTime() < 172800000
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
      <Card   className="h-160  overflow-hidden hover:shadow-2xl hover:shadow-neutral-800/50 hover:-translate-y-2 transition-all duration-500 border-0 bg-card shadow-lg border-border/50 cursor-pointer">
        
        
        <PropertyCarousel isNewProperty={isNewProperty} images={property.images || []} />


        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 z-20 h-11 w-11 rounded-full bg-card/95 hover:bg-card backdrop-blur-sm shadow-lg border-border/50"
          >
          <Heart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>

          
        <CardContent className="p-6 pt-0 pb-6">

          <div className="top-3 mb-3 z-20 flex flex-wrap gap-2">
            
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-muted/90 backdrop-blur-sm">
              {property.capacity?.toUpperCase()} - {property.gender?.toUpperCase()}
            </Badge>
            {property.furnished && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Furnished
              </Badge>
            )}
            {property.near_college && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                Near College
              </Badge>
            )}
          <div>
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-muted/90 backdrop-blur-sm">
              {property.rating ? `⭐ ${property.rating.toFixed(1)}` : "No ratings yet"}
            </Badge>
          </div>
          </div>


         

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.area || "Dharamshala"} - {property.address.split(",")[0]}
              </span>
            </div>

            <CardTitle className="text-xl font-bold leading-tight line-clamp-2 hover:text-primary transition-colors">
              {property.title}
            </CardTitle>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                <span>
                  {property.capacity === "single" ? "1 bed" : property.capacity === "duo" ? "2 beds" : "3 beds"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {property.capacity === "single" ? "1 guest" : property.capacity === "duo" ? "2 guests" : "3 guests"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-border/50 border-t">
              <div>
                <div className="text-2xl font-black text-foreground">Rs {property.rent}</div>
                <div className="text-sm text-muted-foreground">
                  month {property.deposit ? `+ Rs ${property.deposit} deposit` : ""}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <div>{property.views} views</div>
                <div>{property.inquiries} inquiries</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
