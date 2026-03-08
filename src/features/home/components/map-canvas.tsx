"use client"

import { useEffect, useMemo, useState } from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import type { Property } from "../types"

export type MarkerSelection = {
  property: Property
  clickPoint: {
    x: number
    y: number
  }
}

export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

type MapCanvasProps = {
  properties: Property[]
  onBoundsChange: (bounds: MapBounds) => void
  onOpenProperty: (propertyId: string) => void
  isOpen: boolean
  onInteractionStart?: () => void
  onSelectProperty?: (selection: MarkerSelection) => void
  activePropertyId?: string | null
  onMapClick?: () => void
  onActiveMarkerPointChange?: (point: { x: number; y: number } | null) => void
}

const DEFAULT_CENTER: [number, number] = [32.219, 76.3234]
const GOVT_COLLEGE_DHARAMSHALA: [number, number] = [32.1992, 76.3247]

function MapEventBridge({
  onBoundsChange,
  onInteractionStart,
  onMapClick,
  activeProperty,
  onActiveMarkerPointChange,
}: {
  onBoundsChange: (bounds: MapBounds) => void
  onInteractionStart?: () => void
  onMapClick?: () => void
  activeProperty?: Property
  onActiveMarkerPointChange?: (point: { x: number; y: number } | null) => void
}) {
  const updateActiveMarkerPoint = (map: L.Map) => {
    if (!activeProperty || typeof activeProperty.lat !== "number" || typeof activeProperty.lng !== "number") {
      onActiveMarkerPointChange?.(null)
      return
    }

    const point = map.latLngToContainerPoint([activeProperty.lat, activeProperty.lng])
    const size = map.getSize()
    const isWithinCanvas = point.x >= 0 && point.y >= 0 && point.x <= size.x && point.y <= size.y

    onActiveMarkerPointChange?.(isWithinCanvas ? { x: point.x, y: point.y } : null)
  }

  useMapEvents({
    load(event) {
      const bounds = event.target.getBounds()
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      })
      updateActiveMarkerPoint(event.target)
    },
    moveend(event) {
      const bounds = event.target.getBounds()
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      })
      updateActiveMarkerPoint(event.target)
    },
    move(event) {
      updateActiveMarkerPoint(event.target)
    },
    movestart() {
      onInteractionStart?.()
    },
    zoomstart() {
      onInteractionStart?.()
    },
    dragstart() {
      onInteractionStart?.()
    },
    click() {
      onMapClick?.()
    },
  })
  return null
}

function MapResizer({ isOpen }: { isOpen: boolean }) {
  const map = useMap()

  useEffect(() => {
    const runInvalidate = () => map.invalidateSize()
    const timeoutA = window.setTimeout(runInvalidate, 30)
    const timeoutB = window.setTimeout(runInvalidate, 150)
    const timeoutC = window.setTimeout(runInvalidate, 380)
    const timeoutD = window.setTimeout(runInvalidate, 750)
    const timeoutE = window.setTimeout(runInvalidate, 1200)
    window.addEventListener("resize", runInvalidate)

    return () => {
      window.clearTimeout(timeoutA)
      window.clearTimeout(timeoutB)
      window.clearTimeout(timeoutC)
      window.clearTimeout(timeoutD)
      window.clearTimeout(timeoutE)
      window.removeEventListener("resize", runInvalidate)
    }
  }, [isOpen, map])

  return null
}

function usePriceIcon(price: number, isActive = false, compact = false) {
  const label = compact ? `Rs ${price}` : `Rs ${price}`
  const padding = compact ? "4px 8px" : "6px 10px"
  const fontSize = compact ? "11px" : "12px"
  const iconWidth = compact ? 56 : 64
  const iconHeight = compact ? 24 : 28
  const background = isActive ? "#111827" : "#ffffff"
  const textColor = isActive ? "#ffffff" : "#111827"
  const border = isActive ? "1px solid #111827" : "1px solid #d4d4d8"
  const shadow = isActive ? "0 6px 18px rgba(0,0,0,.4)" : "0 2px 8px rgba(0,0,0,.25)"

  return useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="background:${background};border:${border};border-radius:9999px;padding:${padding};font-size:${fontSize};font-weight:700;color:${textColor};box-shadow:${shadow};white-space:nowrap">${label}</div>`,
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [iconWidth / 2, iconHeight / 2],
      }),
    [background, border, fontSize, iconHeight, iconWidth, label, padding, shadow, textColor],
  )
}

function PriceMarker({
  property,
  onOpenProperty,
  onSelectProperty,
  isActive,
}: {
  property: Property
  onOpenProperty: (propertyId: string) => void
  onSelectProperty?: (selection: MarkerSelection) => void
  isActive: boolean
}) {
  const icon = usePriceIcon(property.rent, isActive, false)

  return (
    <Marker
      position={[property.lat as number, property.lng as number]}
      icon={icon}
      eventHandlers={{
        click: (event) => {
          onSelectProperty?.({
            property,
            clickPoint: {
              x: event.containerPoint.x,
              y: event.containerPoint.y,
            },
          })
        },
        dblclick: () => {
          onOpenProperty(property.id)
        },
      }}
      zIndexOffset={isActive ? 1200 : 800}
    />
  )
}

function CollegeMarker() {
  const collegeIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;gap:6px;background:#111827;color:#fff;border-radius:9999px;padding:6px 10px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3)"><span style="font-size:14px;line-height:1">📍</span><span>Govt College</span></div>`,
        iconSize: [120, 30],
        iconAnchor: [18, 24],
      }),
    [],
  )

  return (
    <Marker position={GOVT_COLLEGE_DHARAMSHALA} icon={collegeIcon} zIndexOffset={1000}>
      <Popup>
        <div className="space-y-1">
          <p className="font-semibold">Government College Dharamshala</p>
          <p className="text-xs text-muted-foreground">Reference pin for nearby property search.</p>
        </div>
      </Popup>
    </Marker>
  )
}

export function MapCanvas({
  properties,
  onBoundsChange,
  onOpenProperty,
  isOpen,
  onInteractionStart,
  onSelectProperty,
  activePropertyId,
  onMapClick,
  onActiveMarkerPointChange,
}: MapCanvasProps) {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || ""
  const [useFallbackTiles, setUseFallbackTiles] = useState(false)

  const validProperties = useMemo(
    () => properties.filter((property) => typeof property.lat === "number" && typeof property.lng === "number"),
    [properties],
  )

  const activeProperty = useMemo(
    () => validProperties.find((property) => property.id === activePropertyId),
    [activePropertyId, validProperties],
  )

  if (!mapTilerKey) {
    return (
      <div className="h-full w-full rounded-2xl border border-border/50 flex items-center justify-center p-4 text-sm text-muted-foreground">
        Set NEXT_PUBLIC_MAPTILER_KEY in .env.local to use MapTiler.
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        className="h-full w-full"
        preferCanvas
        zoomAnimation
        markerZoomAnimation
      >
        <MapResizer isOpen={isOpen} />
        {useFallbackTiles ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            updateWhenIdle
            keepBuffer={4}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`}
            updateWhenIdle
            keepBuffer={4}
            eventHandlers={{
              tileerror: () => setUseFallbackTiles(true),
            }}
          />
        )}
        <MapEventBridge
          onBoundsChange={onBoundsChange}
          onInteractionStart={onInteractionStart}
          onMapClick={onMapClick}
          activeProperty={activeProperty}
          onActiveMarkerPointChange={onActiveMarkerPointChange}
        />
        {validProperties.map((property) => (
          <PriceMarker
            key={property.id}
            property={property}
            onOpenProperty={onOpenProperty}
            onSelectProperty={onSelectProperty}
            isActive={activePropertyId === property.id}
          />
        ))}
        <CollegeMarker />
      </MapContainer>
    </div>
  )
}
