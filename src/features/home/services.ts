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
  const nextViews = currentViews + 1
  const { data, error } = await supabase
    .from("properties")
    .update({ views: nextViews })
    .eq("id", propertyId)
    .select("views")
    .single()

  if (error) {
    return currentViews
  }

  return (data?.views as number | undefined) ?? nextViews
}

export async function incrementPropertyInquiries(propertyId: string, currentInquiries: number): Promise<number> {
  const nextInquiries = currentInquiries + 1
  const { data, error } = await supabase
    .from("properties")
    .update({ inquiries: nextInquiries })
    .eq("id", propertyId)
    .select("inquiries")
    .single()

  if (error) {
    return currentInquiries
  }

  return (data?.inquiries as number | undefined) ?? nextInquiries
}
