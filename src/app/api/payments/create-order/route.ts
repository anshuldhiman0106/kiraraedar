import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const cleanEnv = (value?: string) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
    const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
    const razorpayKeyId = cleanEnv(process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
    const razorpayKeySecret = cleanEnv(process.env.RAZORPAY_KEY_SECRET)
    const planAmountInr = Number(cleanEnv(process.env.RAZORPAY_PLAN_AMOUNT_INR) || 100)
    const planName = cleanEnv(process.env.RAZORPAY_PLAN_NAME) || "Landlord Pro Plan"

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured.", code: "MISSING_RAZORPAY_CONFIG" },
        { status: 500 },
      )
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase auth environment variables are not configured.", code: "MISSING_SUPABASE_CONFIG" },
        { status: 500 },
      )
    }

    if (razorpayKeySecret === "your_razorpay_key_secret") {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET is still placeholder. Set real Razorpay secret key." },
        { status: 500 },
      )
    }

    if (!Number.isFinite(planAmountInr) || planAmountInr <= 0) {
      return NextResponse.json(
        { error: "RAZORPAY_PLAN_AMOUNT_INR must be a positive number.", code: "INVALID_PLAN_AMOUNT" },
        { status: 500 },
      )
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    const order = await razorpay.orders.create({
      amount: Math.round(planAmountInr * 100),
      currency: "INR",
      receipt: `pln_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
      notes: {
        user_id: user.id,
        plan: planName,
      },
    })

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const { error: paymentInsertError } = await adminClient.from("owner_plan_payments").insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount_paise: order.amount,
        currency: order.currency,
        plan_name: planName,
        status: "created",
      })

      if (paymentInsertError) {
        console.error("Payment row insert error:", paymentInsertError)
      }
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY missing. Skipping payment row insert.")
    }

    return NextResponse.json({
      // Always return the same key_id that was used to create the order on the server.
      // This prevents client-side NEXT_PUBLIC key mismatch (live vs test) in production.
      key: razorpayKeyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: planName,
    })
  } catch (error) {
    const maybeError = error as {
      error?: { description?: string; code?: string }
      description?: string
      statusCode?: number
      code?: string
      message?: string
    }

    const message =
      maybeError?.error?.description ||
      maybeError?.description ||
      maybeError?.message ||
      "An unexpected error occurred."
    const statusCode =
      typeof maybeError?.statusCode === "number" && maybeError.statusCode >= 400 && maybeError.statusCode < 600
        ? maybeError.statusCode
        : 500

    console.error("Create order error:", {
      message,
      statusCode,
      code: maybeError?.error?.code || maybeError?.code || "UNKNOWN",
    })

    return NextResponse.json(
      {
        error: message,
        code: maybeError?.error?.code || maybeError?.code || "CREATE_ORDER_FAILED",
      },
      { status: statusCode },
    )
  }
}
