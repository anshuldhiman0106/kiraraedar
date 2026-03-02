export type PropertyOwner = {
  full_name?: string | null
  profile_photo?: string | null
  verified_landlord?: boolean | null
}

export type Property = {
  id: string
  owner_id?: string
  owner?: PropertyOwner | null
  title: string
  description?: string
  rent: number
  deposit?: number
  address: string
  area?: string
  gender?: string
  capacity?: string
  available: boolean
  furnished?: boolean
  near_college?: boolean
  lat?: number | null
  lng?: number | null
  views: number
  inquiries: number
  rating?: number
  images?: string[]
  created_at?: string
}
