import { NextResponse } from "next/server";
import crypto from "node:crypto";

const OTP_SIGNING_SECRET = process.env.OTP_SIGNING_SECRET || process.env.TWO_FACTOR_API_KEY || "";

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

function verifyOtpSessionToken(sessionId: string): { phone: string; otpHash: string; exp: number } | null {
  const [payloadPart, signaturePart] = sessionId.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", OTP_SIGNING_SECRET)
    .update(payloadPart)
    .digest("base64url");

  if (expectedSignature !== signaturePart) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8")
    ) as { phone?: string; otpHash?: string; exp?: number };

    if (!parsed.phone || !parsed.otpHash || !parsed.exp) {
      return null;
    }

    return {
      phone: parsed.phone,
      otpHash: parsed.otpHash,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { phone, code, sessionId } = await req.json();

  if (!phone || !code || !sessionId) {
    return NextResponse.json(
      { error: "Phone, OTP and session are required" },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizeIndianPhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Phone must be a valid Indian mobile number" },
      { status: 400 }
    );
  }

  if (!OTP_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "OTP_SIGNING_SECRET is not configured" },
      { status: 500 }
    );
  }

  try {
    const session = verifyOtpSessionToken(String(sessionId).trim());
    if (!session) {
      return NextResponse.json(
        { error: "Invalid OTP session" },
        { status: 400 }
      );
    }

    if (session.exp < Date.now()) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (session.phone !== normalizedPhone) {
      return NextResponse.json(
        { error: "Phone mismatch for this OTP session" },
        { status: 400 }
      );
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(`${String(code).trim()}:${OTP_SIGNING_SECRET}`)
      .digest("hex");

    if (codeHash === session.otpHash) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid OTP" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("OTP verification failed:", error?.message);
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}
