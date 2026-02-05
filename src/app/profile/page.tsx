
"use client";
export const dynamic = "force-dynamic"



import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { User, Phone, SlidersHorizontal } from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("basic");
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const [waOtpSent, setWaOtpSent] = useState(false);
  const [waOtp, setWaOtp] = useState("");
  const [waVerifying, setWaVerifying] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const sendPhoneOtp = async () => {
    if (!profile.phone) {
      toast.error("Enter phone number first");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: profile.phone,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setPhoneOtpSent(true);
    toast.success("OTP sent on phone");
  };

  const verifyPhoneOtp = async () => {
    setPhoneVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: profile.phone,
      token: phoneOtp,
      type: "sms",
    });

    if (error) {
      toast.error("Invalid OTP");
      setPhoneVerifying(false);
      return;
    }

    await saveField("phone_verified", true);
    setPhoneVerifying(false);
    toast.success("Phone number verified");
  };

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data || { id: user.id });
    setLoading(false);
  };

  const saveField = async (field: string, value: any) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    await supabase.from("profiles").upsert(newProfile);
  };

  const completion = () => {
    const fields = [
      profile.full_name,
      profile.phone,
      profile.role,
      profile.college,
      profile.gender_preference,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {" "}
        <Spinner className="mr-2" /> Loading…
      </div>
    );
  }

  const sendWhatsappOtp = async () => {
    if (!profile.whatsapp_number) {
      toast.error("Enter WhatsApp number first");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: profile.whatsapp_number,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setWaOtpSent(true);
    toast.success("OTP sent on WhatsApp");
  };

  const verifyWhatsappOtp = async () => {
    setWaVerifying(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: profile.whatsapp_number,
      token: waOtp,
      type: "sms",
    });

    if (error) {
      toast.error("Invalid OTP");
      setWaVerifying(false);
      return;
    }

    await saveField("whatsapp_verified", true);
    setWaVerifying(false);
    toast.success("WhatsApp number verified");
  };

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex justify-center items-center">
          <div className="mb-10 flex items-center gap-2 text-white">
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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Complete your profile</h1>
            <p className="text-sm text-muted-foreground">
              This helps us match you faster
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="rounded-2xl">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Profile strength</span>
              <span className="font-medium">{completion()}%</span>
            </div>
            <Progress value={completion()} />
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>You can edit this anytime</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="basic" className="gap-1">
                  <User size={16} /> Basic
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-1">
                  <Phone size={16} /> Contact
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-1">
                  <SlidersHorizontal size={16} /> Preferences
                </TabsTrigger>
              </TabsList>

              {/* BASIC */}
              <TabsContent value="basic" className="space-y-4">
                <Input
                  placeholder="Full name"
                  value={profile.full_name || ""}
                  onChange={(e) => saveField("full_name", e.target.value)}
                />

                <Select
                  value={profile.role || ""}
                  onValueChange={(v) => saveField("role", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who are you?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renter">
                      Student / Looking for room
                    </SelectItem>
                    <SelectItem value="owner">Property owner</SelectItem>
                    <SelectItem value="roommate_seeker">
                      Looking for roommate
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={profile.college || ""}
                  onValueChange={(v) => saveField("college", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="College / Work" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Govt College Dharamshala">
                      Govt College Dharamshala
                    </SelectItem>
                    <SelectItem value="Central University Dharamshala">
                      Central University Dharamshala
                    </SelectItem>
                    <SelectItem value="GDC Kangra">GDC Kangra</SelectItem>
                    <SelectItem value="Working Professional">
                      Working Professional
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>

              {/* CONTACT */}
              <TabsContent value="contact" className="space-y-4">
                <div className="flex">
                  <div className="flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">
                    +91
                  </div>

                  <Input
                    className="rounded-l-none"
                    placeholder="Phone number"
                    value={profile.phone?.replace("+91", "") || ""}
                    onChange={(e) =>
                      saveField(
                        "phone",
                        `+91${e.target.value.replace(/\D/g, "")}`,
                      )
                    }
                    disabled={profile.phone_verified}
                    maxLength={10}
                  />
                </div>

                {!profile.phone_verified && !phoneOtpSent && (
                  <Button variant="outline" onClick={sendPhoneOtp}>
                    Send OTP
                  </Button>
                )}

                {phoneOtpSent && !profile.phone_verified && (
                  <div className="space-y-3">
                    <InputOTP
                      maxLength={6}
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                    >
                      <InputOTPGroup>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>

                    <Button onClick={verifyPhoneOtp} disabled={phoneVerifying}>
                      {phoneVerifying ? "Verifying…" : "Verify OTP"}
                    </Button>
                  </div>
                )}

                {profile.phone_verified && (
                  <p className="text-sm text-green-600">
                    Phone number verified ✓
                  </p>
                )}

               
                <div className="flex">
  <div className="flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">
    +91
  </div>

  <Input
    className="rounded-l-none"
    placeholder="WhatsApp number"
    value={profile.whatsapp_number?.replace("+91", "") || ""}
    onChange={(e) =>
      saveField("whatsapp_number", `+91${e.target.value.replace(/\D/g, "")}`)
    }
    disabled={profile.whatsapp_verified}
    maxLength={10}
  />
</div>

                {!profile.whatsapp_verified && !waOtpSent && (
                  <Button variant="outline" onClick={sendWhatsappOtp}>
                    Send WhatsApp OTP
                  </Button>
                )}

                {waOtpSent && !profile.whatsapp_verified && (
                  <div className="space-y-3">
                    <InputOTP maxLength={6} value={waOtp} onChange={setWaOtp}>
                      <InputOTPGroup>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>

                    <Button onClick={verifyWhatsappOtp} disabled={waVerifying}>
                      {waVerifying ? "Verifying…" : "Verify WhatsApp OTP"}
                    </Button>
                  </div>
                )}

                {profile.whatsapp_verified && (
                  <p className="text-sm text-green-600">
                    WhatsApp number verified ✓
                  </p>
                )}

                <Input
                  placeholder="Current location"
                  value={profile.current_location || ""}
                  onChange={(e) =>
                    saveField("current_location", e.target.value)
                  }
                />
              </TabsContent>

              {/* PREFERENCES */}
              <TabsContent value="preferences" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min budget"
                    value={profile.roommate_budget_min || ""}
                    onChange={(e) =>
                      saveField("roommate_budget_min", Number(e.target.value))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max budget"
                    value={profile.roommate_budget_max || ""}
                    onChange={(e) =>
                      saveField("roommate_budget_max", Number(e.target.value))
                    }
                  />
                </div>

                <Select
                  value={profile.gender_preference || ""}
                  onValueChange={(v) => saveField("gender_preference", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Room gender preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={profile.food_habits || ""}
                  onValueChange={(v) => saveField("food_habits", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Food habits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non-veg">Non-veg</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="p-6 pt-0">
            <Link href="/search">
              <Button size="lg" className="w-full rounded-xl">
                Finish & start searching
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
