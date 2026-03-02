import { supabase } from "@/lib/supabase"
import type { Property } from "./types"

export async function fetchAvailableProperties(limit = 12): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
        *,
        views,
        inquiries
      `,
    )
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []) as Property[]
}
