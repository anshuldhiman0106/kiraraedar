import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "Phone and OTP required" },
      { status: 400 }
    );
  }

  try {
    const check = await client.verify.v2
      .services(process.env.VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (check.status === "approved") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid OTP" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}
