import { NextResponse } from "next/server";
import crypto from "node:crypto";

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY || "";
const OTP_SIGNING_SECRET = process.env.OTP_SIGNING_SECRET || TWO_FACTOR_API_KEY;

function normalizeIndianPhone(phone: string): string | null {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+91")) {
    const digits = trimmed.slice(3).replace(/\D/g, "");
    return digits.length === 10 ? digits : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return null;
}

function isIndianMobileNumber(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

function createOtpSessionToken(phone: string, otp: string): string {
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const otpHash = crypto
    .createHash("sha256")
    .update(`${otp}:${OTP_SIGNING_SECRET}`)
    .digest("hex");

  const payload = Buffer.from(
    JSON.stringify({ phone, otpHash, exp }),
    "utf8"
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", OTP_SIGNING_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number required" },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizeIndianPhone(phone);

  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Phone must be a valid Indian mobile number, e.g. +919876543210" },
      { status: 400 }
    );
  }

  if (!isIndianMobileNumber(normalizedPhone)) {
    return NextResponse.json(
      { error: "Only Indian mobile numbers are allowed for SMS OTP" },
      { status: 400 }
    );
  }

  if (!TWO_FACTOR_API_KEY) {
    return NextResponse.json(
      { error: "TWO_FACTOR_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!OTP_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "OTP_SIGNING_SECRET is not configured" },
      { status: 500 }
    );
  }

  try {
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const response = await fetch(
      `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${normalizedPhone}/${otp}`,
      { method: "GET", cache: "no-store" }
    );

    const payload = (await response.json().catch(() => null)) as
      | { Status?: string; Details?: string }
      | null;

    if (!response.ok || payload?.Status !== "Success" || !payload?.Details) {
      console.error("2Factor send OTP error:", payload);
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    const sessionToken = createOtpSessionToken(normalizedPhone, otp);

    return NextResponse.json({
      success: true,
      status: "pending",
      sessionId: sessionToken,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("2Factor send OTP error:", error?.message);

    return NextResponse.json(
      {
        error: error?.message || "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}
