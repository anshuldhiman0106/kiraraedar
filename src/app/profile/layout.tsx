import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile",
  description: "Complete and update your Kiraedar profile.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
