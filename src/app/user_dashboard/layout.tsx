import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Owner Dashboard",
}

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
