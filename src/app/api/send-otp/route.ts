import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number required" },
      { status: 400 }
    );
  }

  if (!phone.startsWith("+")) {
    return NextResponse.json(
      { error: "Phone must be in E.164 format, e.g. +919876543210" },
      { status: 400 }
    );
  }

  try {
    const verification = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return NextResponse.json({
      success: true,
      status: verification.status,
    });
  } catch (err: any) {
    console.error("Twilio error:", err?.message);
    console.error("Twilio code:", err?.code);
    console.error("Twilio status:", err?.status);

    return NextResponse.json(
      {
        error: err?.message || "Failed to send OTP",
        code: err?.code,
      },
      { status: 500 }
    );
  }
}
