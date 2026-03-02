"use client"

import dynamic from "next/dynamic"
import type { Property } from "../types"
import type { MapBounds } from "./map-canvas"

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
  isOpen: boolean
}

export function MapSearchPanel({ properties, onBoundsChange, onOpenProperty, isOpen }: MapSearchPanelProps) {
  return (
    <div className="h-full w-full min-h-[280px]">
      <DynamicMapCanvas
        properties={properties}
        onBoundsChange={onBoundsChange}
        onOpenProperty={onOpenProperty}
        isOpen={isOpen}
      />
    </div>
  )
}
