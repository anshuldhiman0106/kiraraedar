export type Property = {
  id: string
  title: string
  rent: number
  deposit?: number
  address: string
  area?: string
  gender?: string
  capacity?: string
  available: boolean
  furnished?: boolean
  near_college?: boolean
  views: number
  inquiries: number
  rating?: number
  images?: string[]
  created_at?: string
}
