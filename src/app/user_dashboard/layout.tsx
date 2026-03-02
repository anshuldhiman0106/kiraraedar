import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Manage your property listings and owner account on Kiraedar.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
