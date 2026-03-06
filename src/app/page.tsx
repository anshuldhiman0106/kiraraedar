"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconHome, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useAuthSession } from "@/hooks/use-auth-session"
import HomePage from "@/components/Home"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Shield, Sparkles } from "lucide-react"
import { toast } from "sonner"

const OWNER_PLAN_PRICE_INR = 100

export default function KiraraedarHero() {
  const router = useRouter()

  const { session, user, loading: authLoading } = useAuthSession()
  const [statusLoading, setStatusLoading] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{
    profileCompleted: boolean
    phoneVerified: boolean
    role: string | null
    subscriptionStatus: string | null
    verifiedLandlord: boolean
    fullName: string | null
    email: string | null
    phone: string | null
    occupation: string | null
    preferredContactMethod: string | null
  } | null>(null)
  const [showOwnerPlanModal, setShowOwnerPlanModal] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState(false)

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as typeof window & { Razorpay?: unknown }).Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      if (!user) {
        setProfileStatus(null)
        return
      }

      setStatusLoading(true)
      const [{ data }, { data: ownerProfile }] = await Promise.all([
        supabase
          .from("profiles")
          .select("profile_completed, phone_verified, role, subscription_status, full_name, email, phone, occupation, preferred_contact_method")
          .eq("id", user.id)
          .single(),
        supabase
          .from("owner_profiles")
          .select("verified_landlord")
          .eq("profile_id", user.id)
          .maybeSingle(),
      ])

      if (!active) return
      setProfileStatus({
        profileCompleted: !!data?.profile_completed,
        phoneVerified: !!data?.phone_verified,
        role: data?.role ?? null,
        subscriptionStatus: data?.subscription_status ?? null,
        verifiedLandlord: !!ownerProfile?.verified_landlord,
        fullName: data?.full_name ?? null,
        email: data?.email ?? null,
        phone: data?.phone ?? null,
        occupation: data?.occupation ?? null,
        preferredContactMethod: data?.preferred_contact_method ?? null,
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

  useEffect(() => {
    if (!session || !profileStatus) {
      setShowOwnerPlanModal(false)
      return
    }

    const isOwner = profileStatus.role === "owner"
    const hasActivePlan = profileStatus.subscriptionStatus === "active"
    const shouldShowOwnerPlan = isOwner && !hasActivePlan

    setShowOwnerPlanModal(shouldShowOwnerPlan)
  }, [session, profileStatus])

  const handleUpgradePlan = async () => {
    if (!session?.access_token || !profileStatus) {
      toast.error("Please login again to continue.")
      return
    }

    setUpgradingPlan(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout.")
        return
      }

      const createOrderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!createOrderResponse.ok) {
        const errorData = (await createOrderResponse.json().catch(() => null)) as
          | { error?: string; code?: string }
          | null
        toast.error(errorData?.error || "Unable to start payment.")
        return
      }

      const orderData = (await createOrderResponse.json()) as {
        key: string
        orderId: string
        amount: number
        currency: string
        planName: string
      }

      type RazorpayHandlerResponse = {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }

      type RazorpayOptions = {
        key: string
        amount: number
        currency: string
        name: string
        description: string
        order_id: string
        prefill: { name?: string; email?: string; contact?: string }
        notes: { plan: string }
        theme: { color: string }
        handler: (response: RazorpayHandlerResponse) => void | Promise<void>
      }

      const RazorpayCtor = (window as Window & { Razorpay: new (options: RazorpayOptions) => { open: () => void } })
        .Razorpay

      const razorpay = new RazorpayCtor({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Kiraedar",
        description: orderData.planName,
        order_id: orderData.orderId,
        prefill: {
          name: profileStatus.fullName || "",
          email: profileStatus.email || "",
          contact: profileStatus.phone || "",
        },
        notes: {
          plan: orderData.planName,
        },
        theme: {
          color: "#10b981",
        },
        handler: async (response) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(response),
          })

          if (!verifyResponse.ok) {
            toast.error("Payment verification failed.")
            return
          }

          const verifyData = (await verifyResponse.json()) as {
            success: boolean
            subscription_status?: string
            verified_landlord?: boolean
          }

          if (!verifyData.success) {
            toast.error("Payment verification failed.")
            return
          }

          setProfileStatus((current) =>
            current
              ? {
                  ...current,
                  subscriptionStatus: verifyData.subscription_status ?? "active",
                  verifiedLandlord: verifyData.verified_landlord ?? true,
                }
              : current,
          )
          setShowOwnerPlanModal(false)
          toast.success("Pro plan activated. Verified landlord tag enabled.")
        },
      })

      razorpay.open()
    } catch (error) {
      console.error(error)
      toast.error("Could not complete the payment flow.")
    } finally {
      setUpgradingPlan(false)
    }
  }

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

  return (
    <>
      <HomePage />
      <Dialog open={showOwnerPlanModal} onOpenChange={setShowOwnerPlanModal}>
        <DialogContent className="overflow-hidden border-emerald-500/30 p-0 sm:max-w-2xl">
          <div className="bg-gradient-to-br from-emerald-500/15 via-background to-background p-8">
          <DialogHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Pro Upgrade
            </div>
            <DialogTitle className="flex items-center gap-3 text-3xl font-bold leading-tight sm:text-4xl">
              <Shield className="h-8 w-8 text-emerald-600" />
              Upgrade to Kiraedar Pro
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed sm:text-lg">
              Unlock verified Owner badge and improve listing .
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-card/80 p-6 shadow-sm">
            <p className="text-lg font-semibold sm:text-xl">What you get</p>
            <div className="mt-4  flex flex-wrap gap-2">
              <Badge className="bg-blue-600 p-4 text-lg text-white">Verified Owner Tag</Badge>
              <Badge className="bg-emerald-600 p-4 text-lg text-white">Higher Trust</Badge>
              <Badge className="bg-slate-700 p-4 text-lg text-white">Better Lead Conversion</Badge>
            </div>
            <div className="mt-5 space-y-3">
              <p className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Stand out with a verified profile badge
              </p>
              <p className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Increase owner profile trust and response quality
              </p>
            </div>
            <p className="mt-5 text-base font-medium text-muted-foreground sm:text-lg">
              One-time activation at Rs {OWNER_PLAN_PRICE_INR}.
            </p>
          </div>
          <DialogFooter className="mt-7 gap-3 sm:justify-end">
            <Button variant="outline" size="lg" className="h-12 px-6 text-base" onClick={() => setShowOwnerPlanModal(false)}>
              Maybe later
            </Button>
            <Button size="lg" className="h-12 px-7 text-base font-semibold" onClick={handleUpgradePlan} disabled={upgradingPlan}>
              {upgradingPlan ? "Starting payment..." : `Get Pro - Rs ${OWNER_PLAN_PRICE_INR}`}
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}
