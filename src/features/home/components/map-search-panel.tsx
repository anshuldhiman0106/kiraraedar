"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Property } from "../types"
import type { MapBounds, MarkerSelection } from "./map-canvas"

const DynamicMapCanvas = dynamic(() => import("./map-canvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl border border-border/50 bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
})

type MapSearchPanelProps = {
  properties: Property[]
  onBoundsChange: (bounds: MapBounds) => void
  onOpenProperty: (propertyId: string) => void
  onCloseMap?: () => void
  isOpen: boolean
}

function ResultListCard({
  property,
  onOpenProperty,
  onSelect,
  selected,
}: {
  property: Property
  onOpenProperty: (propertyId: string) => void
  onSelect: (property: Property) => void
  selected: boolean
}) {
  const coverImage = property.images?.[0]

  return (
    <div
      className={`rounded-2xl border bg-card p-2 transition ${selected ? "border-foreground/30 shadow-md" : "border-border/60"}`}
    >
      <button type="button" className="w-full text-left" onClick={() => onSelect(property)}>
        <div className="relative overflow-hidden rounded-xl">
          {coverImage ? (
            <img src={coverImage} alt={property.title} className="h-36 w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-36 w-full bg-muted" />
          )}
        </div>

        <div className="px-1 pt-2">
          <p className="line-clamp-1 text-base font-semibold">{property.title}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">{property.address}</p>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-semibold">Rs {property.rent}</span>
            <span className="text-muted-foreground">
              {property.capacity === "single" ? "1 bed" : property.capacity === "duo" ? "2 beds" : "3 beds"}
            </span>
          </div>
        </div>
      </button>

      <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => onOpenProperty(property.id)}>
        View property
      </Button>
    </div>
  )
}

export function MapSearchPanel({ properties, onBoundsChange, onOpenProperty, onCloseMap, isOpen }: MapSearchPanelProps) {
  const MOBILE_SHEET_COLLAPSED_PEEK = 80
  const DESKTOP_CARD_WIDTH = 280
  const DESKTOP_CARD_HEIGHT = 250
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isMobileResultsOpen, setIsMobileResultsOpen] = useState(true)
  const [mobilePreviewProperty, setMobilePreviewProperty] = useState<Property | null>(null)
  const [desktopPreviewProperty, setDesktopPreviewProperty] = useState<Property | null>(null)
  const [desktopPreviewPoint, setDesktopPreviewPoint] = useState<{ x: number; y: number } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [sheetDragOffsetY, setSheetDragOffsetY] = useState(0)
  const touchStartYRef = useRef<number | null>(null)
  const desktopMapRef = useRef<HTMLDivElement | null>(null)

  const validProperties = useMemo(
    () => properties.filter((property) => typeof property.lat === "number" && typeof property.lng === "number"),
    [properties],
  )

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
    if (!validProperties.length) {
      setSelectedProperty(null)
      return
    }

    // Clear selectedProperty if it's no longer in the valid properties list
    if (selectedProperty && !validProperties.some((property) => property.id === selectedProperty.id)) {
      setSelectedProperty(null)
    }
  }, [selectedProperty, validProperties])

  useEffect(() => {
    if (isDesktop) {
      setIsMobileResultsOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    // Reset mobile results sheet when map closes
    if (!isOpen) {
      setIsMobileResultsOpen(false)
      setMobilePreviewProperty(null)
      setDesktopPreviewProperty(null)
      setDesktopPreviewPoint(null)
    }
  }, [isOpen])

  const handleMapInteractionStart = () => {
    if (!isDesktop && !mobilePreviewProperty) {
      // Keep existing behavior for the results sheet, but do not dismiss an open preview card.
      setIsMobileResultsOpen(false)
    }
  }

  const handleMapBackgroundClick = () => {
    setDesktopPreviewProperty(null)
    setMobilePreviewProperty(null)
    setDesktopPreviewPoint(null)
    setSelectedProperty(null)
  }

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property)
    if (!isDesktop) {
      setIsMobileResultsOpen(false)
      setMobilePreviewProperty(null)
    }
  }

  const handleMapMarkerSelect = (selection: MarkerSelection) => {
    const { property, clickPoint } = selection
    setSelectedProperty(property)
    if (!isDesktop) {
      setIsMobileResultsOpen(false)
      setMobilePreviewProperty(property)
    } else {
      setDesktopPreviewProperty(property)
      setDesktopPreviewPoint(clickPoint)
    }
  }

  const getAnchoredPosition = (
    point: { x: number; y: number } | null,
    mapElement: HTMLDivElement | null,
    cardWidth: number,
    cardHeight: number,
  ) => {
    if (!point || !mapElement) {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    }

    const rect = mapElement.getBoundingClientRect()
    const pad = 12
    const gap = 30
    const minX = cardWidth / 2 + pad
    const maxX = rect.width - cardWidth / 2 - pad
    const minY = pad
    const maxY = rect.height - cardHeight - pad

    const clampedX = Math.min(Math.max(point.x, minX), Math.max(minX, maxX))
    const rawY = point.y + gap
    const clampedY = Math.min(Math.max(rawY, minY), Math.max(minY, maxY))

    return {
      left: `${clampedX}px`,
      top: `${clampedY}px`,
      transform: "translateX(-50%)",
    }
  }

  const handleActiveMarkerPointChange = (point: { x: number; y: number } | null) => {
    if (isDesktop && desktopPreviewProperty) {
      if (!point) {
        setDesktopPreviewProperty(null)
        setDesktopPreviewPoint(null)
        setSelectedProperty(null)
        return
      }

      setDesktopPreviewPoint(point)
    }

    if (!isDesktop && mobilePreviewProperty) {
      if (!point) {
        setMobilePreviewProperty(null)
        setSelectedProperty(null)
        return
      }
    }
  }

  const handleSheetTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDesktop || isMobileResultsOpen) {
      return
    }

    touchStartYRef.current = event.touches[0]?.clientY ?? null
    setSheetDragOffsetY(0)
  }

  const handleSheetTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDesktop || isMobileResultsOpen || touchStartYRef.current === null) {
      return
    }

    const currentY = event.touches[0]?.clientY
    if (typeof currentY !== "number") {
      return
    }

    const deltaY = currentY - touchStartYRef.current
    if (deltaY < 0) {
      // Allow only upward drag and cap the offset for a controlled pull effect.
      setSheetDragOffsetY(Math.max(deltaY, -180))
    } else {
      setSheetDragOffsetY(0)
    }
  }

  const handleSheetTouchEnd = () => {
    if (isDesktop || isMobileResultsOpen) {
      return
    }

    if (sheetDragOffsetY <= -48) {
      setIsMobileResultsOpen(true)
    }

    touchStartYRef.current = null
    setSheetDragOffsetY(0)
  }

  return (
    <div className="relative h-full w-full min-h-80 overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="hidden h-full lg:grid lg:grid-cols-[minmax(360px,420px)_1fr]">
        <div className="border-r border-border/60">
          <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">
            {validProperties.length} homes in map area
          </div>
          <ScrollArea className="h-[calc(100%-49px)]">
            <div className="space-y-3 p-3">
              {validProperties.map((property) => (
                <ResultListCard
                  key={property.id}
                  property={property}
                  onOpenProperty={onOpenProperty}
                  onSelect={handleSelectProperty}
                  selected={selectedProperty?.id === property.id}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div ref={desktopMapRef} className="relative h-full w-full overflow-visible">
          <DynamicMapCanvas
            properties={validProperties}
            onBoundsChange={onBoundsChange}
            onOpenProperty={onOpenProperty}
            isOpen={isOpen}
            onInteractionStart={handleMapInteractionStart}
            onSelectProperty={handleMapMarkerSelect}
            activePropertyId={selectedProperty?.id ?? null}
            onMapClick={handleMapBackgroundClick}
            onActiveMarkerPointChange={isDesktop ? handleActiveMarkerPointChange : undefined}
          />
          
          {desktopPreviewProperty && (
            <div
              className="absolute z-1000 w-70 max-w-[calc(100%-24px)]"
              style={{
                pointerEvents: "auto",
                ...getAnchoredPosition(desktopPreviewPoint, desktopMapRef.current, DESKTOP_CARD_WIDTH, DESKTOP_CARD_HEIGHT),
              }}
            >
              <div
                role="button"
                tabIndex={0}
                className="relative cursor-pointer overflow-hidden rounded-3xl border-2 border-border/60 bg-card shadow-2xl"
                onClick={() => onOpenProperty(desktopPreviewProperty.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onOpenProperty(desktopPreviewProperty.id)
                  }
                }}
              >
                <button
                  type="button"
                  className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDesktopPreviewProperty(null)
                    setSelectedProperty(null)
                  }}
                  aria-label="Close property preview"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative h-40 w-full overflow-hidden">
                  {desktopPreviewProperty.images?.[0] ? (
                    <img
                      src={desktopPreviewProperty.images[0]}
                      alt={desktopPreviewProperty.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-base font-semibold">{desktopPreviewProperty.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{desktopPreviewProperty.address}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {desktopPreviewProperty.capacity === "single" ? "1 bed" : desktopPreviewProperty.capacity === "duo" ? "2 beds" : "3 beds"}
                  </p>
                  <p className="mt-1.5 text-base font-bold">Rs {desktopPreviewProperty.rent}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative isolate h-full w-full lg:hidden">
        <div className="relative z-0 h-full w-full">
          <DynamicMapCanvas
            properties={validProperties}
            onBoundsChange={onBoundsChange}
            onOpenProperty={onOpenProperty}
            isOpen={isOpen}
            onInteractionStart={handleMapInteractionStart}
            onSelectProperty={handleMapMarkerSelect}
            activePropertyId={selectedProperty?.id ?? null}
            onMapClick={handleMapBackgroundClick}
            onActiveMarkerPointChange={!isDesktop ? handleActiveMarkerPointChange : undefined}
          />
        </div>

        <div className="pointer-events-none absolute top-3 left-3 z-1200">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto rounded-full"
            onClick={onCloseMap}
          >
            <X className="mr-1 h-4 w-4" />
            Close map
          </Button>
        </div>

        {!isMobileResultsOpen && !mobilePreviewProperty && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-1200 flex justify-center">
            <Button
              type="button"
              className="pointer-events-auto rounded-full px-5"
              onClick={() => setIsMobileResultsOpen(true)}
            >
              Show {validProperties.length} homes
            </Button>
          </div>
        )}

        {!mobilePreviewProperty && (
          <div
            className={`absolute inset-x-0 bottom-0 z-1200 rounded-t-3xl border-t border-border/60 bg-card pb-[max(8px,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ${
              isMobileResultsOpen ? "translate-y-0" : "translate-y-[calc(100%-84px)]"
            }`}
            style={
              !isMobileResultsOpen && sheetDragOffsetY !== 0
                ? { transform: `translateY(calc(100% - ${MOBILE_SHEET_COLLAPSED_PEEK}px + ${sheetDragOffsetY}px))` }
                : undefined
            }
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onTouchCancel={handleSheetTouchEnd}
          >
            <button
              type="button"
              className="mx-auto mt-2 block h-1.5 w-12 rounded-full bg-muted-foreground/35"
              onClick={() => setIsMobileResultsOpen((open) => !open)}
              aria-label="Toggle map results"
            />

            <div className="px-4 pb-2 pt-3 text-center text-lg font-semibold">{validProperties.length} homes</div>

            <ScrollArea className="h-[36vh] px-4 pb-4">
              <div className="space-y-3 pb-5">
                {validProperties.map((property) => (
                  <ResultListCard
                    key={property.id}
                    property={property}
                    onOpenProperty={onOpenProperty}
                    onSelect={handleSelectProperty}
                    selected={selectedProperty?.id === property.id}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {mobilePreviewProperty && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-1200 flex justify-center px-4 pb-[max(8px,env(safe-area-inset-bottom))]">
            <div
              role="button"
              tabIndex={0}
              className="pointer-events-auto relative w-70 max-w-[calc(100vw-24px)] cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
              onClick={() => onOpenProperty(mobilePreviewProperty.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onOpenProperty(mobilePreviewProperty.id)
                }
              }}
            >
              <button
                type="button"
                className="absolute top-2 left-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow"
                onClick={(event) => {
                  event.stopPropagation()
                  setMobilePreviewProperty(null)
                  setSelectedProperty(null)
                  setIsMobileResultsOpen(true)
                }}
                aria-label="Close property preview"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-[112px_1fr] gap-2">
                <div className="h-full min-h-28 overflow-hidden">
                  {mobilePreviewProperty.images?.[0] ? (
                    <img
                      src={mobilePreviewProperty.images[0]}
                      alt={mobilePreviewProperty.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="py-2 pr-2.5">
                  <p className="line-clamp-1 text-xl font-semibold">{mobilePreviewProperty.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{mobilePreviewProperty.address}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mobilePreviewProperty.capacity === "single" ? "1 bed" : mobilePreviewProperty.capacity === "duo" ? "2 beds" : "3 beds"}
                  </p>
                  <p className="mt-1.5 text-xl font-bold">Rs {mobilePreviewProperty.rent}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
