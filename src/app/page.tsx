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

  if (!session) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/40">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Kiraedar logo" className="h-9 w-9" />
              <span className="text-lg font-semibold tracking-wide">Kiraedar</span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="rounded-full px-5">
                Sign in
              </Button>
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-10 pb-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Student housing platform for Dharamshala
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Find verified rooms near your college in minutes.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Browse real listings, compare rent instantly, and contact owners directly across
                McLeod Ganj, Shyam Nagar, Ram Nagar and nearby student areas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="h-12 rounded-full px-7">
                    <IconSearch className="mr-2 h-5 w-5" />
                    Search Rooms
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 rounded-full px-7">
                    <IconHome className="mr-2 h-5 w-5" />
                    List Property
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 text-left sm:max-w-md">
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="text-xl font-bold">100+</p>
                  <p className="text-xs text-muted-foreground">Active listings</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="text-xl font-bold">4 areas</p>
                  <p className="text-xs text-muted-foreground">Student hotspots</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="text-xl font-bold">Direct</p>
                  <p className="text-xs text-muted-foreground">Owner contact</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xl">
              <p className="text-sm font-semibold">Why students use Kiraedar</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-sm font-medium">Verified owner profiles</p>
                  <p className="mt-1 text-xs text-muted-foreground">Build trust before visiting the property.</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-sm font-medium">Transparent rent + deposit</p>
                  <p className="mt-1 text-xs text-muted-foreground">No hidden surprises in final pricing.</p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="text-sm font-medium">Map based discovery</p>
                  <p className="mt-1 text-xs text-muted-foreground">Find rooms by exact locality and distance.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Trusted by students around Govt College Dharamshala
          </p>
        </div>
      </section>
    )
  }

  return <HomePage />
}
