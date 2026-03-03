import { supabase } from "@/lib/supabase"
import type { Property } from "./types"

export type OwnerProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  verified_landlord: boolean
}

export async function fetchAvailableProperties(limit = 12, offset = 0): Promise<Property[]> {
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
    .eq("available", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw error
  }

  return (data ?? []) as Property[]
}

export async function fetchPropertiesByIds(propertyIds: string[]): Promise<Property[]> {
  if (!propertyIds.length) {
    return []
  }

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
    .in("id", propertyIds)

  if (error) {
    throw error
  }

  const properties = (data ?? []) as Property[]

  return properties.sort((a, b) => propertyIds.indexOf(a.id) - propertyIds.indexOf(b.id))
}

export async function fetchPropertyById(propertyId: string): Promise<Property | null> {
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
    .single()

  if (error) {
    return null
  }

  return data as Property
}

export async function fetchAvailablePropertiesCount(): Promise<number> {
  const { count, error } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("available", true)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function fetchPropertiesInBounds(bounds: {
  north: number
  south: number
  east: number
  west: number
}): Promise<Property[]> {
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
    .eq("available", true)
    .gte("lat", bounds.south)
    .lte("lat", bounds.north)
    .gte("lng", bounds.west)
    .lte("lng", bounds.east)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    throw error
  }

  return (data ?? []) as Property[]
}

export async function fetchOwnerProfileById(ownerId: string): Promise<OwnerProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone ,  verified_landlord")
    .eq("id", ownerId)
    .single()

  if (error) {
    return null
  }

  return data as OwnerProfile
}

export async function incrementPropertyViews(propertyId: string, currentViews: number): Promise<number> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/increment-views`, {
      method: "POST",
      cache: "no-store",
    })

    if (!response.ok) {
      return currentViews
    }

    const payload = (await response.json()) as { views?: number }
    return typeof payload.views === "number" ? payload.views : currentViews
  } catch {
    return currentViews
  }
}

export async function incrementPropertyInquiries(propertyId: string, currentInquiries: number): Promise<number> {
  try {
    const response = await fetch(`/api/properties/${propertyId}/increment-inquiries`, {
      method: "POST",
      cache: "no-store",
    })

    if (!response.ok) {
      return currentInquiries
    }

    const payload = (await response.json()) as { inquiries?: number }
    return typeof payload.inquiries === "number" ? payload.inquiries : currentInquiries
  } catch {
    return currentInquiries
  }
}
