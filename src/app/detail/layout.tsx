import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Property Details",
  description: "Explore room details, rent, amenities, and location before contacting the owner on Kiraedar.",
}

export default function DetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
