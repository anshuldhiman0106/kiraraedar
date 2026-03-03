import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase server environment variables are not configured." }, { status: 500 })
    }

    const { id } = await Promise.resolve(context.params)
    if (!id) {
      return NextResponse.json({ error: "Property id is required." }, { status: 400 })
    }

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await adminClient.rpc("increment_property_inquiries", {
      p_property_id: id,
    })

    if (!error) {
      return NextResponse.json({ inquiries: typeof data === "number" ? data : 0 })
    }

    const { data: row, error: fetchError } = await adminClient
      .from("properties")
      .select("inquiries")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("increment_property_inquiries fetch fallback error:", fetchError)
      return NextResponse.json({ error: "Failed to increment inquiries." }, { status: 500 })
    }

    const nextInquiries = (row?.inquiries ?? 0) + 1
    const { data: updated, error: updateError } = await adminClient
      .from("properties")
      .update({ inquiries: nextInquiries })
      .eq("id", id)
      .select("inquiries")
      .single()

    if (updateError) {
      console.error("increment_property_inquiries update fallback error:", updateError)
      return NextResponse.json({ error: "Failed to increment inquiries." }, { status: 500 })
    }

    return NextResponse.json({ inquiries: updated?.inquiries ?? nextInquiries })
  } catch (error) {
    console.error("Increment inquiries route error:", error)
    return NextResponse.json({ error: "Failed to increment inquiries." }, { status: 500 })
  }
}
