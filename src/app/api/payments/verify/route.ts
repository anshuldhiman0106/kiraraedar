import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

type VerifyPayload = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as VerifyPayload

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== body.razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error: paymentUpdateError } = await adminClient
      .from("owner_plan_payments")
      .update({
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_signature: body.razorpay_signature,
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", body.razorpay_order_id)

    if (paymentUpdateError) {
      console.error("Payment row update error:", paymentUpdateError)
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        subscription_status: "active",
        verified_landlord: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscription_status: "active",
      verified_landlord: true,
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
