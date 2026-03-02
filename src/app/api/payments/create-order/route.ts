import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"

const PLAN_AMOUNT_INR = Number(process.env.RAZORPAY_PLAN_AMOUNT_INR ?? 100)
const PLAN_NAME = process.env.RAZORPAY_PLAN_NAME ?? "Landlord Pro Plan"

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys are not configured." }, { status: 500 })
    }

    if (process.env.RAZORPAY_KEY_SECRET === "your_razorpay_key_secret") {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET is still placeholder. Set real Razorpay secret key." },
        { status: 500 },
      )
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: Math.round(PLAN_AMOUNT_INR * 100),
      currency: "INR",
      receipt: `pln_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
      notes: {
        user_id: user.id,
        plan: PLAN_NAME,
      },
    })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error: paymentInsertError } = await adminClient.from("owner_plan_payments").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount_paise: order.amount,
      currency: order.currency,
      plan_name: PLAN_NAME,
      status: "created",
    })

    if (paymentInsertError) {
      console.error("Payment row insert error:", paymentInsertError)
    }

    return NextResponse.json({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: PLAN_NAME,
    })
  } catch (error) {
    console.error("Create order error:", error)
    const message = error instanceof Error ? error.message : "Failed to create order"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
