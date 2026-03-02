import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Phone",
  description: "Verify your phone number to secure your Kiraedar account.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifyPhoneLayout({ children }: { children: React.ReactNode }) {
  return children
}
