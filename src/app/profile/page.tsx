"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Camera,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  HousePlus,
  IndianRupee,
  Languages,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AuthCta } from "@/components/auth-cta";
import { cn } from "@/lib/utils";

type Profile = {
  id?: string;
  full_name?: string;
  gender?: string;
  phone?: string;
  phone_verified?: boolean;
  whatsapp_number?: string;
  profile_photo?: string;
  college?: string;
  year_of_study?: string;
  branch?: string;
  role?: string;
  headline?: string;
  occupation?: string;
  company_or_college?: string;
  move_in_date?: string;
  monthly_budget_min?: number;
  monthly_budget_max?: number;
  preferred_contact_method?: string;
  preferred_areas?: string[];
  current_location?: string;
  profile_completed?: boolean;
};

const PREFERRED_AREAS = [
  "Shyam Nagar",
  "McLeod Ganj",
  "Badol",
  "Chiran",
  "Dari",
  "Darnu",
  "Sakoh",
  "Near Stadium",
  "Civil Lines",
  "Kacheri",
  "Dharamkot",
  "Naddi",
  "Bhagsu",
];

const INTENT_OPTIONS = [
  {
    role: "owner",
    title: "List room",
    description: "I want to post my property and find tenants.",
    Icon: HousePlus,
      HoverContent:false
  },
  {
    role: "renter",
    title: "Search room",
    description: "I want to discover and book a place to stay.",
    Icon: Search,
    HoverContent:false
  },
  {
    role: "roommate_seeker",
    title: "Find roommate",
    description: "I want to match with compatible roommates.",
    Icon: Users,
    HoverContent:
      "This feature is coming soon! We're working hard to launch roommate matching in the next few months. In the meantime, you can still list your profile and search for rooms as a renter.",
  },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const anchor = useComboboxAnchor();

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (!active) return;
        setAuthMissing(true);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (!active) return;

      setProfile(profileData ?? { id: data.user.id });
      setLoading(false);

       if (profileData?.profile_completed) {
        if (!profileData.phone_verified) {
          router.replace("/profile/verifyphone");
          return;
        }
        router.replace("/");
        return;
      }
    };

    fetchProfile();

   

    return () => {
      active = false;
    };
  }, []);

  const updateProfile = async (field: keyof Profile, value: unknown) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    const { error } = await supabase.from("profiles").upsert(updated);
    if (error) {
      toast.error("Could not save that change. Please retry.");
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("Please login again");
        return;
      }

      const fileExt =
        (file.name.split(".").pop() || "").toLowerCase() ||
        file.type.split("/")[1] ||
        "jpg";
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        toast.error("Upload failed");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const photoUrl = `${data.publicUrl}?v=${Date.now()}`;
      await updateProfile("profile_photo", photoUrl);
      toast.success("Profile photo updated");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const checks = useMemo(
    () => [
      {
        label: "Basics",
        complete: Boolean(
          profile.full_name &&
          profile.gender &&
          profile.role &&
          profile.current_location,
        ),
      },
      {
        label: "Neighborhoods",
        complete: Boolean(profile.preferred_areas?.length),
      },
      {
        label: "Profile photo",
        complete: Boolean(profile.profile_photo),
      },
      {
        label: "Phone verification",
        complete: Boolean(profile.phone_verified),
      },
    ],
    [profile],
  );

  const completion = useMemo(() => {
    const done = checks.filter((step) => step.complete).length;
    return Math.round((done / checks.length) * 100);
  }, [checks]);

  const isComplete = useMemo(
    () =>
      Boolean(
        profile.full_name &&
        profile.current_location &&
        profile.preferred_areas?.length &&
        profile.gender &&
        profile.role,
      ),
    [profile],
  );

  const roleLabel =
    profile.role === "owner"
      ? "Listing rooms"
      : profile.role === "roommate_seeker"
        ? "Finding roommate"
        : profile.role === "renter"
          ? "Searching rooms"
          : "Choose your goal";

  const completeAndContinue = async () => {
    if (!isComplete) return;
    setSaving(true);
    await updateProfile("profile_completed", true);
    toast.success("Profile saved. Continue to phone verification.");
    router.push("/profile/verifyphone");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="mr-2" /> Loading...
      </div>
    );
  }

  if (authMissing) {
    return (
      <AuthCta
        title="Sign in to edit your profile"
        description="Create your profile to start searching or listing properties."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background),var(--muted)_28%))] px-4 py-6 sm:px-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.5fr_1fr]"
      >
        <div className="space-y-5">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-blue-500/10 px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                        <AvatarImage src={profile.profile_photo} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg">
                          {profile.full_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:scale-105"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </Label>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold">
                        {profile.full_name || "Complete your profile"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.current_location ||
                          "Add your current location"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          <UserRound className="mr-1 h-3.5 w-3.5" />
                          {roleLabel}
                        </Badge>
                        {profile.phone_verified ? (
                          <Badge className="rounded-full bg-emerald-600 text-white">
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full">
                            Verification pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1.5 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {completion}% complete
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 sm:px-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Profile strength
                  </span>
                  <span className="font-medium">{completion}%</span>
                </div>
                <Progress value={completion} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Better profiles get faster responses from owners and
                  roommates.
                </p>
              </div>
            </CardContent>
          </Card>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="hidden"
          />

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Your details</CardTitle>
              <CardDescription>
                Airbnb-like listing trust starts with a strong profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <Label className="px-1">Why are you here? *</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {INTENT_OPTIONS.map(
                      ({ role, title, description, Icon , HoverContent}) => (
                        <button
                          key={role}
                          disabled={role === "roommate_seeker"} // disable if role is roommate_seeker
                          type="button"
                          onClick={() => {
                            if (role !== "roommate_seeker") {
                              updateProfile("role", role);
                            }
                          }}
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            "hover:border-primary/50 hover:bg-primary/5",
                            profile.role === role
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card",
                            role === "roommate_seeker"                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer",
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4" />
                            {title}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                          {HoverContent && (
                            <HoverCard>
                              <HoverCardTrigger>Hover</HoverCardTrigger>
                              <HoverCardContent>
                                <p>{HoverContent}</p>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Full name *"
                  value={profile.full_name ?? ""}
                  onChange={(e) => updateProfile("full_name", e.target.value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    value={profile.gender ?? ""}
                    onValueChange={(v) => updateProfile("gender", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Gender *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Gender</SelectLabel>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Headline (example: Final year student, quiet and tidy)"
                    value={profile.headline ?? ""}
                    onChange={(e) => updateProfile("headline", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Current Location *"
                  value={profile.current_location ?? ""}
                  onChange={(e) =>
                    updateProfile("current_location", e.target.value)
                  }
                />
                <div className="space-y-2">
                  <Label className="px-1">Preferred Areas *</Label>
                  <Combobox
                    multiple
                    autoHighlight
                    value={profile.preferred_areas ?? []}
                    onValueChange={(v) => updateProfile("preferred_areas", v)}
                    items={PREFERRED_AREAS}
                  >
                    <ComboboxChips ref={anchor} className="w-full">
                      <ComboboxValue>
                        {(values: string[]) => (
                          <>
                            {values.map((value) => (
                              <ComboboxChip className="text-base" key={value}>
                                {value}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              placeholder={
                                values.length === 0
                                  ? "Select preferred areas"
                                  : ""
                              }
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={anchor}>
                      <ComboboxEmpty>No areas found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Lifestyle and plans
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Occupation"
                    value={profile.occupation ?? ""}
                    onChange={(e) =>
                      updateProfile("occupation", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Company or College"
                    value={profile.company_or_college ?? ""}
                    onChange={(e) =>
                      updateProfile("company_or_college", e.target.value)
                    }
                  />
                  <Input
                    type="date"
                    value={profile.move_in_date ?? ""}
                    onChange={(e) =>
                      updateProfile("move_in_date", e.target.value)
                    }
                  />
                  
                  <Input
                    type="number"
                    min={0}
                    placeholder="Monthly budget min"
                    value={profile.monthly_budget_min ?? ""}
                    onChange={(e) =>
                      updateProfile(
                        "monthly_budget_min",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Monthly budget max"
                    value={profile.monthly_budget_max ?? ""}
                    onChange={(e) =>
                      updateProfile(
                        "monthly_budget_max",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
                
              </section>

              

              {profile.role === "renter" && (
                <section className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Student Details</h3>
                    <p className="text-xs text-muted-foreground">
                      This helps us show campus-relevant listings.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Select
                        disabled
                        value={profile.college ?? ""}
                        onValueChange={(v) => updateProfile("college", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="College" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Govt College Dharamshala">
                            Govt. College Dharamshala
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Select
                      value={profile.branch ?? ""}
                      onValueChange={(v) => updateProfile("branch", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Branch</SelectLabel>
                          <SelectItem value="BCA">BCA</SelectItem>
                          <SelectItem value="BBA">BBA</SelectItem>
                          <SelectItem value="BCom">BCom</SelectItem>
                          <SelectItem value="BA">BA</SelectItem>
                          <SelectItem value="BSc">BSc</SelectItem>
                          <SelectItem value="Biotechnology">
                            Biotechnology
                          </SelectItem>
                          <SelectItem value="BTech">BTech</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Select
                      value={profile.year_of_study ?? ""}
                      onValueChange={(v) => updateProfile("year_of_study", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Year of study" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Year</SelectLabel>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </section>
              )}



              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact and bio
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    value={profile.preferred_contact_method ?? "in_app"}
                    onValueChange={(v) =>
                      updateProfile("preferred_contact_method", v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Preferred contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Preferred Contact Method</SelectLabel>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Phone number"
                    value={profile.phone ?? ""}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                  />
                  <Input
                    placeholder="WhatsApp number"
                    value={profile.whatsapp_number ?? ""}
                    onChange={(e) =>
                      updateProfile("whatsapp_number", e.target.value)
                    }
                  />
                </div>
              </section>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Setup checklist</CardTitle>
              <CardDescription>
                Complete these to unlock better matching and trust.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={completion} />
              <div className="space-y-2">
                {checks.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span>{step.label}</span>
                    {step.complete ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={completeAndContinue}
                className="h-11 w-full rounded-xl"
                disabled={!isComplete || saving}
              >
                {isComplete ? (
                  <>
                    Continue to verification
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Complete required fields
                  </>
                )}
              </Button>
              {uploading && (
                <p className="text-center text-xs text-muted-foreground">
                  Uploading your photo...
                </p>
              )}
              <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">
                  Friendly onboarding flow
                </p>
                <p className="flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  Set intent
                </p>
                <p className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Add move-in and lifestyle details
                </p>
                <p className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" />
                  Add budget to get better matches
                </p>
                <p className="flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  Add languages for better communication
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
