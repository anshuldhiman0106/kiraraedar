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

  try {
    const verification = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return NextResponse.json({
      success: true,
      status: verification.status, // pending
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

