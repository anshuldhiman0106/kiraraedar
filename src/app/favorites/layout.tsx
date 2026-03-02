import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Favorites",
  description: "View and manage your saved room listings on Kiraedar.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children
}
