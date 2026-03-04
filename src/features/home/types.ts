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
  bed_count?: number | null
  electricity_included?: boolean
  water_included?: boolean
  wifi_included?: boolean
  attached_bathroom?: boolean
  parking_available?: boolean
  laundry_available?: boolean
  kitchen_available?: boolean
  other_facilities?: string | null
  near_college?: boolean
  lat?: number | null
  lng?: number | null
  views: number
  inquiries: number
  rating?: number
  images?: string[]
  created_at?: string
}
