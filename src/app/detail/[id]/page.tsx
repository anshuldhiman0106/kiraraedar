"use client"

import { useEffect, useMemo, useState } from "react"
import { Bed, Building, ChevronLeft, Copy, Heart, MapPin, Share, ShieldCheck, Sparkles, Users, Verified } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  fetchOwnerProfileById,
  fetchPropertyById,
  incrementPropertyInquiries,
  incrementPropertyViews,
  type OwnerProfile,
} from "@/features/home/services"
import type { Property } from "@/features/home/types"

export default function PropertyDetailPage() {
  const [property, setProperty] = useState<Property | null>(null)
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [contactingOwner, setContactingOwner] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    const loadProperty = async () => {
      if (!params?.id) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchPropertyById(params.id)
        if (!data) {
          setProperty(null)
          return
        }

        setProperty(data)

        if (data.owner_id) {
          const ownerData = await fetchOwnerProfileById(data.owner_id)
          setOwner(ownerData)
        }

        const updatedViews = await incrementPropertyViews(data.id, data.views ?? 0)
        setProperty((current) => (current ? { ...current, views: updatedViews } : current))
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [params?.id])

  useEffect(() => {
    if (!property?.id) {
      return
    }

    const channel = supabase
      .channel(`property-live-${property.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "properties",
          filter: `id=eq.${property.id}`,
        },
        (payload) => {
          const next = payload.new as Partial<Property>
          setProperty((current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              views: typeof next.views === "number" ? next.views : current.views,
              inquiries: typeof next.inquiries === "number" ? next.inquiries : current.inquiries,
              available: typeof next.available === "boolean" ? next.available : current.available,
            }
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [property?.id])

  const images = useMemo(() => property?.images ?? [], [property?.images])

  useEffect(() => {
    if (!property?.id) {
      return
    }

    const rawFavorites = localStorage.getItem("favoriteProperties")
    if (!rawFavorites) {
      setIsSaved(false)
      return
    }

    try {
      const parsed = JSON.parse(rawFavorites)
      setIsSaved(Array.isArray(parsed) && parsed.includes(property.id))
    } catch {
      setIsSaved(false)
    }
  }, [property?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading property details...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">Property not found</h1>
        <p className="text-muted-foreground text-center">This listing may have been removed or is unavailable.</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    )
  }

  const handleContactOwner = async () => {
    if (!property) {
      return
    }

    setContactingOwner(true)

    try {
      const updatedInquiries = await incrementPropertyInquiries(property.id, property.inquiries ?? 0)
      setProperty((current) => (current ? { ...current, inquiries: updatedInquiries } : current))

      if (owner?.phone) {
        window.location.href = `tel:${owner.phone}`
        return
      }

      if (owner?.email) {
        window.location.href = `mailto:${owner.email}?subject=Inquiry%20for%20${encodeURIComponent(property.title)}`
        return
      }

      toast.success("Inquiry sent to owner")
    } finally {
      setContactingOwner(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const sharePayload = {
      title: property.title,
      text: `Check out this property on Kiraedar: ${property.title}`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(sharePayload)
        return
      } catch {
        // fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Unable to share right now")
    }
  }

  const handleToggleSave = () => {
    if (!property?.id) {
      return
    }

    const rawFavorites = localStorage.getItem("favoriteProperties")
    let favorites: string[] = []

    if (rawFavorites) {
      try {
        const parsed = JSON.parse(rawFavorites)
        if (Array.isArray(parsed)) {
          favorites = parsed.filter((id): id is string => typeof id === "string")
        }
      } catch {
        favorites = []
      }
    }

    const nextFavorites = isSaved
      ? favorites.filter((id) => id !== property.id)
      : [...new Set([...favorites, property.id])]

    localStorage.setItem("favoriteProperties", JSON.stringify(nextFavorites))
    setIsSaved(!isSaved)
    toast.success(isSaved ? "Removed from favorites" : "Saved to favorites")
  }

  const handleCopyCoordinates = async () => {
    if (!hasCoordinates) {
      toast.error("Location coordinates are not available")
      return
    }

    try {
      await navigator.clipboard.writeText(`${property.lat},${property.lng}`)
      toast.success("Coordinates copied")
    } catch {
      toast.error("Unable to copy coordinates")
    }
  }

  const handleNextImage = () => {
    if (!images.length) {
      return
    }
    setActiveImageIndex((current) => (current + 1) % images.length)
  }

  const handlePrevImage = () => {
    if (!images.length) {
      return
    }
    setActiveImageIndex((current) => (current - 1 + images.length) % images.length)
  }

  const hasCoordinates =
    typeof property.lat === "number" &&
    typeof property.lng === "number"

  const mapEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${property.lat}%2C${property.lng}&zoom=15`
    : null

  const externalMapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-3 sm:px-4 lg:px-5">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Kiraedar Logo" className="h-8 w-8" />
            <span className="text-xl font-semibold">Kiraedar</span>
          </Link>
          <div className="flex items-center gap-2">
            
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-4 lg:px-5 py-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-full border border-border/60 bg-card">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="border border-border/60 bg-card" onClick={handleShare}>
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="border border-border/60 bg-card" onClick={handleToggleSave}>
              <Heart className={`h-4 w-4 mr-1 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
              Save
            </Button>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-semibold">{property.title}</h1>
            <Badge variant={property.available ? "secondary" : "destructive"}>
              {property.available ? "Available" : "Booked"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{property.rating ? `★ ${property.rating.toFixed(1)}` : "New listing"}</span>
            <span>•</span>
            <span>{property.views} views</span>
            <span>•</span>
            <span>{property.area || "Dharamshala"} - {property.address}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted mb-8 shadow-sm">
          {images.length ? (
            <>
              <div className="relative md:hidden">
                <img
                  src={images[activeImageIndex]}
                  alt={property.title}
                  className="h-full w-full object-cover aspect-[4/3]"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/70"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/70"
                      onClick={handleNextImage}
                    >
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1">
                      {images.map((_, index) => (
                        <span
                          key={`${property.id}-mobile-dot-${index}`}
                          className={`h-1.5 w-1.5 rounded-full ${index === activeImageIndex ? "bg-white" : "bg-white/55"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="hidden md:grid md:grid-cols-2 gap-1">
                <div className="md:row-span-2">
                  <img src={images[activeImageIndex]} alt={property.title} className="h-full w-full object-cover min-h-[520px]" />
                </div>
                {(images.length > 1 ? images : [images[0], images[0], images[0], images[0]])
                  .slice(0, 4)
                  .map((image, index) => (
                    <button
                      type="button"
                      key={`${property.id}-mosaic-${index}`}
                      onClick={() => setActiveImageIndex((index + 1) % images.length)}
                      className="relative min-h-[258px]"
                    >
                      <img src={image} alt={`${property.title} ${index + 2}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <div className="h-[320px] flex items-center justify-center">
              <Building className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="text-xl font-semibold mb-2">
                {property.capacity?.toUpperCase()} room hosted for {property.gender?.toUpperCase() || "all"}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  {property.capacity === "single" ? "1 bed" : property.capacity === "duo" ? "2 beds" : "3 beds"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {property.capacity === "single" ? "1 guest" : property.capacity === "duo" ? "2 guests" : "3 guests"}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-xl font-semibold mb-3">Listed by</h3>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                  {(owner?.full_name?.trim()?.[0] || "O").toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{owner?.full_name || "Property Owner"}</p>
                  {owner?.verified_landlord && (
                    <div className="flex items-center gap-1 mt-1">
                      <Verified className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">Verified Landlord</span>
                    </div>
                  )}
                  
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Great location</h3>
                  <p className="text-sm text-muted-foreground">Close to key student areas and transport points.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Verified listing</h3>
                  <p className="text-sm text-muted-foreground">Property and details are verified by the platform.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">{property.capacity?.toUpperCase()} - {property.gender?.toUpperCase()}</Badge>
                {property.furnished && <Badge variant="secondary">Furnished</Badge>}
                {property.near_college && <Badge variant="secondary">Near College</Badge>}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xl font-semibold">Where you&apos;ll be</h3>
                <Badge variant="outline">Exact Location</Badge>
              </div>
              <div className="rounded-xl border border-border/60 p-4 bg-background">
                <div className="inline-flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {property.area || "Dharamshala"} - {property.address}
                </div>
                {mapEmbedUrl ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
                    <iframe
                      title={`Map location for ${property.title}`}
                      src={mapEmbedUrl}
                      className="h-64 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Exact map coordinates are not available for this listing.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {hasCoordinates && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyCoordinates}>
                      <Copy className="mr-1 h-4 w-4" />
                      {property.lat?.toFixed(6)}, {property.lng?.toFixed(6)}
                    </Button>
                  )}
                  {externalMapUrl && (
                    <a
                      href={externalMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-3xl font-semibold">Rs {property.rent} <span className="text-base font-normal text-muted-foreground">month</span></p>
              <p className="text-sm text-muted-foreground mt-1">
                {property.deposit ? `+ Rs ${property.deposit} security deposit` : "No security deposit"}
              </p>

              <div className="mt-5 rounded-xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="p-3 border-r border-border/60">
                    <p className="text-[11px] uppercase text-muted-foreground">Views</p>
                    <p className="text-sm font-medium">{property.views}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">Inquiries</p>
                    <p className="text-sm font-medium">{property.inquiries}</p>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4 h-11 rounded-xl" onClick={handleContactOwner} disabled={contactingOwner}>
                {contactingOwner ? "Contacting..." : "Contact owner"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Inquiries are sent directly to the owner</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
