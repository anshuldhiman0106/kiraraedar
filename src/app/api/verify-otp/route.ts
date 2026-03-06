import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const OTP_SIGNING_SECRET = process.env.OTP_SIGNING_SECRET || process.env.TWO_FACTOR_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

function syntheticPhoneEmail(phone: string): string {
  return `phone_${phone}@phone.kiraedar.local`;
}

function syntheticPhonePassword(phone: string): string {
  const hash = crypto
    .createHmac("sha256", OTP_SIGNING_SECRET)
    .update(`phone-login:${phone}`)
    .digest("hex");

  // Ensure mixed characters to satisfy password policy.
  return `Kiraedar#${hash.slice(0, 24)}Aa1!`;
}

async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function createPhoneUser(email: string, password: string, phone: string) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      phone: `+91${phone}`,
      phone_login: true,
    },
  });
}

export async function POST(req: Request) {
  const { phone, code, sessionId, mode } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "Phone and OTP are required" },
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

  try {
    if (!OTP_SIGNING_SECRET) {
      return NextResponse.json(
        { error: "OTP_SIGNING_SECRET is not configured" },
        { status: 500 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "OTP session is required" },
        { status: 400 }
      );
    }

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
      if (String(mode || "").toLowerCase() === "login") {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
          return NextResponse.json(
            { error: "Supabase environment is not configured" },
            { status: 500 }
          );
        }

        const email = syntheticPhoneEmail(normalizedPhone);
        const password = syntheticPhonePassword(normalizedPhone);

        let { response: signInRes, payload: signInPayload } = await signInWithPassword(email, password);

        if (!signInRes.ok) {
          const { error: createUserError } = await createPhoneUser(email, password, normalizedPhone);
          if (createUserError && !String(createUserError.message || "").toLowerCase().includes("already")) {
            return NextResponse.json(
              { error: createUserError.message || "Could not create phone login user" },
              { status: 500 }
            );
          }

          ({ response: signInRes, payload: signInPayload } = await signInWithPassword(email, password));
        }

        if (!signInRes.ok || !signInPayload?.access_token || !signInPayload?.refresh_token) {
          return NextResponse.json(
            { error: signInPayload?.error_description || signInPayload?.error || "Could not create login session" },
            { status: signInRes.status || 400 }
          );
        }

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await adminClient.from("profiles").upsert({
          id: signInPayload.user?.id,
          phone: `+91${normalizedPhone}`,
          whatsapp_number: `+91${normalizedPhone}`,
          phone_verified: true,
        });

        return NextResponse.json({
          success: true,
          mode: "login",
          access_token: signInPayload.access_token,
          refresh_token: signInPayload.refresh_token,
          user: signInPayload.user,
        });
      }

      return NextResponse.json({ success: true, mode: "verify" });
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
