import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Property Details",
}

export default function DetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
