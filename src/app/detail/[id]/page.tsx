"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bed, Building, ChevronLeft, Copy, Flag, Heart, MapPin, Share, ShieldCheck, Sparkles, Users, Verified } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
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
  const VIEW_GUARD_WINDOW_MS = 5000
  const [property, setProperty] = useState<Property | null>(null)
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [contactingOwner, setContactingOwner] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const swipeStartXRef = useRef<number | null>(null)
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

        const viewGuardKey = `property_view_hit_${data.id}`
        const lastViewHit = Number(window.sessionStorage.getItem(viewGuardKey) ?? 0)
        const now = Date.now()

        if (!Number.isFinite(lastViewHit) || now - lastViewHit > VIEW_GUARD_WINDOW_MS) {
          window.sessionStorage.setItem(viewGuardKey, String(now))
          const updatedViews = await incrementPropertyViews(data.id, data.views ?? 0)
          setProperty((current) => (current ? { ...current, views: updatedViews } : current))
        }
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
  const desktopGallery = useMemo(() => {
    if (!images.length) {
      return { hero: null as null | { src: string; index: number }, thumbs: [] as Array<{ src: string; index: number }> }
    }

    const safeIndex = activeImageIndex >= 0 && activeImageIndex < images.length ? activeImageIndex : 0
    const hero = { src: images[safeIndex], index: safeIndex }
    const thumbPool = images
      .map((src, index) => ({ src, index }))
      .filter((item) => item.index !== safeIndex)

    while (thumbPool.length < 4) {
      thumbPool.push(hero)
    }

    return { hero, thumbs: thumbPool.slice(0, 4) }
  }, [images, activeImageIndex])

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

      const normalizePhone = (value: string | null | undefined): string | null => {
        if (!value) return null
        const trimmed = value.trim()
        if (!trimmed) return null
        const hasPlus = trimmed.startsWith("+")
        const digits = trimmed.replace(/\D/g, "")
        if (!digits) return null
        return hasPlus ? `+${digits}` : digits
      }

      const toWhatsappNumber = (value: string | null | undefined): string | null => {
        const normalized = normalizePhone(value)
        if (!normalized) return null
        return normalized.replace(/\D/g, "")
      }

      const title = encodeURIComponent(property.title)
      const message = encodeURIComponent(`Hi, I found "${property.title}" on Kiraedar. Is it still available?`)

      // If listing is not by actual owner, always use phone call by default.
      if (!property.is_property_owner) {
        const listedPhone = normalizePhone(property.actual_owner_phone || owner?.phone || null)
        if (listedPhone) {
          window.location.href = `tel:${listedPhone}`
          return
        }
      } else {
        const preferredMethod = owner?.preferred_contact_method ?? "phone"
        const ownerPhone = normalizePhone(owner?.phone)
        const ownerWhatsapp = toWhatsappNumber(owner?.whatsapp_number || owner?.phone)

        if (preferredMethod === "whatsapp" && ownerWhatsapp) {
          window.open(`https://wa.me/${ownerWhatsapp}?text=${message}`, "_blank", "noopener,noreferrer")
          return
        }

        if (ownerPhone) {
          window.location.href = `tel:${ownerPhone}`
          return
        }

        if (ownerWhatsapp) {
          window.open(`https://wa.me/${ownerWhatsapp}?text=${message}`, "_blank", "noopener,noreferrer")
          return
        }
      }

      if (owner?.email) {
        window.location.href = `mailto:${owner.email}?subject=Inquiry%20for%20${title}`
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

  const handleReportListing = async () => {
    if (!property) {
      return
    }

    const currentUrl = typeof window !== "undefined" ? window.location.href : ""
    const reportDetails = `Listing ID: ${property.id}\nTitle: ${property.title}\nURL: ${currentUrl}`
    
    // Try to copy details to clipboard
    try {
      await navigator.clipboard.writeText(reportDetails)
      toast.success("Listing details copied to clipboard")
    } catch {
      // Silent fail - still open email
    }

    // Open email with prefilled subject and body
    const subject = encodeURIComponent(`Report Listing: ${property.title}`)
    const body = encodeURIComponent(
      `I would like to report the following listing:\n\n` +
      `Listing ID: ${property.id}\n` +
      `Title: ${property.title}\n` +
      `URL: ${currentUrl}\n\n` +
      `Reason for reporting:\n`
    )
    
    window.location.href = `mailto:kiraedarr@gmail.com?subject=${subject}&body=${body}`
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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    swipeStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? swipeStartXRef.current
    const deltaX = endX - swipeStartXRef.current
    const swipeThreshold = 45

    if (deltaX <= -swipeThreshold) {
      handleNextImage()
    } else if (deltaX >= swipeThreshold) {
      handlePrevImage()
    }

    swipeStartXRef.current = null
  }

  const hasCoordinates =
    typeof property.lat === "number" &&
    typeof property.lng === "number"

  const mapEmbedUrl = hasCoordinates
    ? (() => {
      const lat = property.lat as number
      const lng = property.lng as number
      // Wider bbox keeps the pin exact while showing more surrounding area.
      const latDelta = 0.0
      const lngDelta = 0.0
      const left = (lng - lngDelta).toFixed(6)
      const right = (lng + lngDelta).toFixed(6)
      const top = (lat + latDelta).toFixed(6)
      const bottom = (lat - latDelta).toFixed(6)

      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`
    })()
    : null

  const externalMapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
    : null

  const contactButtonText = !property
    ? "Contact owner"
    : !property.is_property_owner
      ? "Call owner"
      : owner?.preferred_contact_method === "whatsapp"
        ? "WhatsApp owner"
        : "Call owner"

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
            <Button variant="ghost" size="sm" className="border border-border/60 bg-card" onClick={handleReportListing}>
              <Flag className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-semibold">{property.title}</h1>
            <Badge variant={property.available ? "secondary" : "destructive"}>
              {property.available ? "Available" : "Booked"}
            </Badge>
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="outline"
                  className={`cursor-help flex items-center gap-1 border-0 ${
                    owner?.verified_landlord
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {owner?.verified_landlord ? "Verified" : "Not verified"}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 text-sm" side="bottom">
                {owner?.verified_landlord ? (
                  <div>
                    <p className="font-semibold mb-1">Verified listing</p>
                    <p className="text-muted-foreground">
                      Property and details are verified by the platform. The owner's identity and ownership documents have been checked.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-1">Not verified</p>
                    <p className="text-muted-foreground">
                      Owner verification is pending. We recommend extra caution when contacting and always verify details in person before making any payments.
                    </p>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
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
              <div
                className="relative md:hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
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
              <div className="hidden lg:grid lg:grid-cols-12 lg:gap-1.5">
                <button
                  type="button"
                  className="col-span-7 overflow-hidden"
                  onClick={() => {
                    if (desktopGallery.hero) {
                      setActiveImageIndex(desktopGallery.hero.index)
                    }
                  }}
                >
                  <img
                    src={desktopGallery.hero?.src ?? images[0]}
                    alt={`${property.title} main image`}
                    className="h-full min-h-[520px] w-full object-cover"
                  />
                </button>
                <div className="col-span-5 grid grid-cols-2 gap-1.5">
                  {desktopGallery.thumbs.map((item, index) => (
                    <button
                      type="button"
                      key={`${property.id}-desktop-thumb-${index}`}
                      onClick={() => setActiveImageIndex(item.index)}
                      className="overflow-hidden"
                    >
                      <img
                        src={item.src}
                        alt={`${property.title} photo ${index + 2}`}
                        className="h-full min-h-[258px] w-full object-cover transition duration-200 hover:scale-[1.03]"
                      />
                    </button>
                  ))}
                </div>
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
                  {property.bed_count
                    ? `${property.bed_count} bed${property.bed_count > 1 ? "s" : ""}`
                    : property.capacity === "single"
                      ? "1 bed"
                      : property.capacity === "duo"
                        ? "2 beds"
                        : "3 beds"}
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
                  <p className="font-medium">{owner?.full_name || "Platform User"}</p>
                  {owner?.verified_landlord && (
                    <div className="flex items-center gap-1 mt-1">
                      <Verified className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">Verified Owner</span>
                    </div>
                  )}
                  {!property.is_property_owner && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Not the property owner
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium">Property owner contact</p>
                {property.is_property_owner ? (
                  <p className="text-muted-foreground">
                    Same as listed user
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {property.actual_owner_name || "Owner"}{property.actual_owner_phone ? ` - ${property.actual_owner_phone}` : ""}
                  </p>
                )}
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
                <ShieldCheck className={`h-5 w-5 mt-0.5 ${owner?.verified_landlord ? "text-emerald-500" : "text-orange-500"}`} />
                <div>
                  <h3 className="font-medium">{owner?.verified_landlord ? "Verified listing" : "Not verified"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {owner?.verified_landlord 
                      ? "Property and details are verified by the platform." 
                      : "Owner verification is pending. Please verify all details in person."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">{property.capacity?.toUpperCase()} - {property.gender?.toUpperCase()}</Badge>
                {property.furnished && <Badge variant="secondary">Furnished</Badge>}
                {property.near_college && <Badge variant="secondary">Near College</Badge>}
                {property.electricity_included && <Badge variant="secondary">Electricity Included</Badge>}
                {property.water_included && <Badge variant="secondary">Water Included</Badge>}
                {property.wifi_included && <Badge variant="secondary">Wi-Fi Included</Badge>}
                {property.attached_bathroom && <Badge variant="secondary">Attached Bathroom</Badge>}
                {property.parking_available && <Badge variant="secondary">Parking</Badge>}
                {property.laundry_available && <Badge variant="secondary">Laundry</Badge>}
                {property.kitchen_available && <Badge variant="secondary">Kitchen</Badge>}
              </div>
              {property.other_facilities && (
                <p className="text-sm text-muted-foreground">
                  Other facilities: {property.other_facilities}
                </p>
              )}
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
                {contactingOwner ? "Contacting..." : contactButtonText}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">Inquiries are sent directly to the owner</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
