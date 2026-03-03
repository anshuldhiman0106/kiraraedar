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
    const { data, error } = await adminClient.rpc("increment_property_views", {
      p_property_id: id,
    })

    if (!error) {
      return NextResponse.json({ views: typeof data === "number" ? data : 0 })
    }

    const { data: row, error: fetchError } = await adminClient
      .from("properties")
      .select("views")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("increment_property_views fetch fallback error:", fetchError)
      return NextResponse.json({ error: "Failed to increment views." }, { status: 500 })
    }

    const nextViews = (row?.views ?? 0) + 1
    const { data: updated, error: updateError } = await adminClient
      .from("properties")
      .update({ views: nextViews })
      .eq("id", id)
      .select("views")
      .single()

    if (updateError) {
      console.error("increment_property_views update fallback error:", updateError)
      return NextResponse.json({ error: "Failed to increment views." }, { status: 500 })
    }

    return NextResponse.json({ views: updated?.views ?? nextViews })
  } catch (error) {
    console.error("Increment views route error:", error)
    return NextResponse.json({ error: "Failed to increment views." }, { status: 500 })
  }
}
