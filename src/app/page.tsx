"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconHome, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function KiraraedarHero() {
  const router = useRouter()

  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null)

  // ✅ Get session and profile
  useEffect(() => {
    const init = async () => {
      // Get session
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Get profile_completed
        const { data: profileData } = await supabase
          .from("profiles")
          .select("profile_completed")
          .eq("id", session.user.id)
          .single()

        setProfileCompleted(profileData?.profile_completed ?? false)

        if (!profileData?.profile_completed) {
          router.push("/profile")
        }
      }

      setLoading(false)
    }

    init()

    // Realtime auth listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return null

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
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl rounded-lg p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Welcome, {user?.email}!</h1>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </Button>
      </div>
    </section>
  )
}
