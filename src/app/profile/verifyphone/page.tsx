"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/phone-input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AuthCta } from "@/components/auth-cta";

const OTP_LENGTH = 6;
const RESEND_TIME = 60;


export default function VerifyPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(RESEND_TIME);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);

  const canResend = countdown === 0;

  /* ---------------- countdown ---------------- */
  useEffect(() => {
    if (step !== "otp" || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown((v) => v - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, step]);

  /* ---------------- auth guard ---------------- */
  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        if (!active) return;
        setAuthMissing(true);
        setSessionLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("profile_completed, phone_verified")
        .eq("id", data.user.id)
        .single();

      if (!active) return;

      if (!profileData?.profile_completed) {
        router.replace("/profile");
        return;
      }

      if (profileData?.phone_verified) {
        router.replace("/");
        return;
      }

      setSessionLoading(false);
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  /* ---------------- send otp ---------------- */
  const sendOtp = async () => {
    if (!phone) {
      toast.error("Enter phone number");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    setLoading(false);

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to send OTP");
      return;
    }

    setStep("otp");
    setCountdown(RESEND_TIME);
    toast.success("OTP sent");
  };

  /* ---------------- verify otp ---------------- */
  const verifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter 6-digit OTP");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp }),
    });

    setLoading(false);

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Invalid OTP");
      return;
    }

    toast.success("Phone verified successfully");
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.data.user.id, phone, phone_verified: true })
        .then(() => {
          router.replace("/");
        });
    }
  };

  /* ---------------- resend ---------------- */
  const resendOtp = async () => {
    if (!canResend) return;
    setOtp("");
    await sendOtp();
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-sm text-muted-foreground">Checking session...</div>
      </div>
    );
  }

  if (authMissing) {
    return (
      <AuthCta
        title="Sign in to verify your phone"
        description="We need your account to securely confirm your number."
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* -------- LOGO -------- */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="Kiraraedar Logo"
              className="h-12 aspect-square"
            />
            <span className="text-xl font-semibold tracking-wide">
              KIRAEDAR
            </span>
          </div>
        </div>

        <Card className="p-8 space-y-6">
          {/* -------- HEADER -------- */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-2xl font-semibold">
              {step === "phone" ? "Verify your phone" : "Enter OTP"}
            </h2>

            {step === "phone" && (
              <p className="text-sm text-muted-foreground">
                We’ll send a one-time code to confirm your number
              </p>
            )}
          </div>

          {/* -------- PHONE STEP -------- */}
          {step === "phone" && (
            <div className="space-y-6">
              <PhoneInput
                defaultCountry="IN"
                placeholder="Enter phone number"
                value={phone}
                onChange={setPhone}
              />

              <Button
                className="w-full h-11"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </Button>
            </div>
          )}

          {/* -------- OTP STEP -------- */}
          {step === "otp" && (
            <div className="space-y-6">
              <p className="text-center text-sm text-muted-foreground">
                Code sent to{" "}
                <span className="font-medium text-foreground">{phone}</span>
              </p>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    {[0, 1, 2].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>

                  <InputOTPSeparator />

                  <InputOTPGroup>
                    {[3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full h-11"
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? "Verifying…" : "Verify OTP"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {canResend ? (
                  <button
                    onClick={resendOtp}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span>Resend in {countdown}s</span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
