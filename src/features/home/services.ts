import { supabase } from "@/lib/supabase"
import type { Property } from "./types"

export type OwnerProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  whatsapp_number: string | null
  preferred_contact_method: "phone" | "whatsapp" | "email" | "in_app" | null
  verified_landlord: boolean
}

type RawPropertyRow = Property & {
  owner?: {
    full_name?: string | null
    profile_photo?: string | null
    owner_profile?: { verified_landlord?: boolean | null } | null
  } | null
}

function normalizeProperty(row: RawPropertyRow): Property {
  const verified = !!row.owner?.owner_profile?.verified_landlord

  return {
    ...row,
    owner: row.owner
      ? {
          full_name: row.owner.full_name ?? null,
          profile_photo: row.owner.profile_photo ?? null,
          verified_landlord: verified,
        }
      : null,
  }
}

const PROPERTY_WITH_OWNER_SELECT = `
  *,
  owner:profiles!properties_owner_id_fkey(
    full_name,
    profile_photo,
    owner_profile:owner_profiles(verified_landlord)
  ),
  views,
  inquiries
`

export async function fetchAvailableProperties(limit = 12, offset = 0): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_WITH_OWNER_SELECT)
    .eq("available", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => normalizeProperty(row as RawPropertyRow))
}

export async function fetchPropertiesByIds(propertyIds: string[]): Promise<Property[]> {
  if (!propertyIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_WITH_OWNER_SELECT)
    .in("id", propertyIds)

  if (error) {
    throw error
  }

  const properties = (data ?? []).map((row) => normalizeProperty(row as RawPropertyRow))

  return properties.sort((a, b) => propertyIds.indexOf(a.id) - propertyIds.indexOf(b.id))
}

export async function fetchPropertyById(propertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_WITH_OWNER_SELECT)
    .eq("id", propertyId)
    .single()

  if (error) {
    return null
  }

  return normalizeProperty(data as RawPropertyRow)
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

type AreaRow = {
  name?: string | null
}

async function fetchAreasFromTable(tableName: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select("name")
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  const uniqueAreas = Array.from(
    new Set(
      ((data ?? []) as AreaRow[])
        .map((row) => row.name?.trim())
        .filter((name): name is string => !!name),
    ),
  )

  return uniqueAreas
}

export async function fetchAreas(): Promise<string[]> {
  let areaTableError: unknown = null
  let areasTableError: unknown = null

  try {
    const areaTableData = await fetchAreasFromTable("area")
    if (areaTableData.length > 0) {
      return areaTableData
    }
  } catch (error) {
    areaTableError = error
  }

  try {
    const areasTableData = await fetchAreasFromTable("areas")
    if (areasTableData.length > 0) {
      return areasTableData
    }
  } catch (error) {
    areasTableError = error
  }

  if (areaTableError && areasTableError) {
    throw areasTableError
  }

  return []
}

export async function fetchPropertiesInBounds(bounds: {
  north: number
  south: number
  east: number
  west: number
}): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_WITH_OWNER_SELECT)
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

  return (data ?? []).map((row) => normalizeProperty(row as RawPropertyRow))
}

export async function fetchOwnerProfileById(ownerId: string): Promise<OwnerProfile | null> {
  const [{ data: profileData, error: profileError }, { data: ownerData, error: ownerError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, whatsapp_number, preferred_contact_method")
        .eq("id", ownerId)
        .single(),
      supabase
        .from("owner_profiles")
        .select("verified_landlord")
        .eq("profile_id", ownerId)
        .maybeSingle(),
    ])

  if (profileError) {
    return null
  }

  if (ownerError && ownerError.code !== "PGRST116") {
    return null
  }

  if (!profileData) {
    return null
  }

  return {
    id: profileData.id,
    full_name: profileData.full_name,
    email: profileData.email,
    phone: profileData.phone,
    whatsapp_number: profileData.whatsapp_number,
    preferred_contact_method: profileData.preferred_contact_method,
    verified_landlord: !!ownerData?.verified_landlord,
  }
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
