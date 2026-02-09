"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconHome, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuthSession } from "@/hooks/use-auth-session"
import HomePage from "@/components/Home"

export default function KiraraedarHero() {
  const router = useRouter()

  const { session, user, loading: authLoading } = useAuthSession()
  const [statusLoading, setStatusLoading] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{
    profileCompleted: boolean
    phoneVerified: boolean
  } | null>(null)

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      if (!user) {
        setProfileStatus(null)
        return
      }

      setStatusLoading(true)
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed, phone_verified")
        .eq("id", user.id)
        .single()

      if (!active) return
      setProfileStatus({
        profileCompleted: !!data?.profile_completed,
        phoneVerified: !!data?.phone_verified,
      })
      setStatusLoading(false)
    }

    loadStatus()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (authLoading || statusLoading) return
    if (!user || !profileStatus) return

    if (!profileStatus.profileCompleted) {
      router.replace("/profile")
      return
    }

    if (!profileStatus.phoneVerified) {
      router.replace("/profile/verifyphone")
    }
  }, [authLoading, statusLoading, user, profileStatus, router])

  if (authLoading || (user && statusLoading)) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking session...</div>
      </section>
    )
  }

  // ❌ Not logged in UI
  if (!session) {
    return (
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mb-10 flex items-center gap-2 text-white">
            <img src="/logo.svg" alt="Kiraraedar Logo" className="h-14 aspect-square" />
            <span className="text-2xl font-semibold tracking-wide">KIRAEDAR</span>
          </div>

          <p className="mb-8 max-w-sm text-sm text-white/80 sm:max-w-xl sm:text-base md:text-lg">
            Rooms for Dharamshala students • McLeod Ganj • Shyam Nagar • Govt College
          </p>

          <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="h-12 w-full rounded-full sm:w-auto">
                <IconSearch className="mr-2 h-5 w-5" />
                Search Rooms
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 w-full rounded-full sm:w-auto">
                <IconHome className="mr-2 h-5 w-5" />
                List Property
              </Button>
            </Link>
          </div>

          <p className="mt-10 text-xs text-white/70 sm:text-sm">
            Trusted by Govt College Dharamshala students
          </p>
        </div>
      </section>
    )
  }

  // ✅ Logged in UI
  return (
    <>
    <HomePage onLogout={() => supabase.auth.signOut().then(() => router.replace("/login"))} />
    </>
  )
}
