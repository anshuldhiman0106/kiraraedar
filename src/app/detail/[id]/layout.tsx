import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"

type ListingSeoRow = {
  id: string
  title: string
  area: string | null
  address: string
  rent: number
  available: boolean
  images: string[] | null
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

const fallbackDescription =
  "Explore room details, rent, amenities, and location before contacting the owner on Kiraedar."

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      title: "Property Details",
      description: fallbackDescription,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data } = await supabase
    .from("properties")
    .select("id, title, area, address, rent, available, images")
    .eq("id", id)
    .maybeSingle<ListingSeoRow>()

  if (!data) {
    return {
      title: "Property Not Found",
      description: "This property listing is unavailable on Kiraedar.",
      robots: { index: false, follow: false },
    }
  }

  const title = `${data.title} | Room for Rent in ${data.area || "Dharamshala"}`
  const description = `${data.title} at Rs ${data.rent}/month in ${data.area || "Dharamshala"}, ${data.address}. Contact the owner directly on Kiraedar.`
  const primaryImage = data.images?.[0]

  return {
    title,
    description,
    alternates: {
      canonical: `/detail/${data.id}`,
    },
    robots: data.available
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/detail/${data.id}`,
      images: primaryImage ? [{ url: primaryImage, alt: data.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  }
}

export default function ListingDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}

