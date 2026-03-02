import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/seo"

type SitemapPropertyRow = {
  id: string
  updated_at: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/detail`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticRoutes
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("available", true)
    .order("updated_at", { ascending: false })
    .limit(5000)

  const listingRoutes: MetadataRoute.Sitemap = ((data ?? []) as SitemapPropertyRow[]).map((property) => ({
    url: `${siteUrl}/detail/${property.id}`,
    lastModified: property.updated_at ? new Date(property.updated_at) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  return [...staticRoutes, ...listingRoutes]
}

