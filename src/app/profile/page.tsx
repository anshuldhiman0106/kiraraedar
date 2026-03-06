"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  HousePlus,
  Search,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthCta } from "@/components/auth-cta";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  full_name: string;
  role: "owner" | "renter" | "roommate_seeker";
  phone: string;
  whatsapp_number: string;
  profile_photo: string;
  preferred_contact_method: "phone" | "whatsapp" | "email" | "in_app";
  current_location: string;
  occupation: string;
  profile_completed: boolean;
  phone_verified: boolean;
};

type StudentRow = {
  college: string;
  year_of_study: string;
  branch: string;
};

type AreaRow = {
  id: number;
  name: string;
};

const INTENT_OPTIONS = [
  {
    role: "owner",
    title: "List room",
    description: "Post your property and receive tenant inquiries.",
    Icon: HousePlus,
    disabled: false,
  },
  {
    role: "renter",
    title: "Search room",
    description: "Find and compare rooms quickly.",
    Icon: Search,
    disabled: false,
  },
  {
    role: "roommate_seeker",
    title: "Find roommate",
    description: "Coming soon.",
    Icon: Users,
    disabled: true,
  },
] as const;
const MIN_PREFERRED_AREAS = 5;

const emptyProfile: ProfileRow = {
  id: "",
  full_name: "",
  role: "renter",
  phone: "",
  whatsapp_number: "",
  profile_photo: "",
  preferred_contact_method: "in_app",
  current_location: "",
  occupation: "",
  profile_completed: false,
  phone_verified: false,
};

const emptyStudent: StudentRow = {
  college: "",
  year_of_study: "",
  branch: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [authMissing, setAuthMissing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow>(emptyProfile);
  const [student, setStudent] = useState<StudentRow>(emptyStudent);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [isPhoneAuthUser, setIsPhoneAuthUser] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!active) return;
        setAuthMissing(true);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const authProvider = String(user.app_metadata?.provider ?? "").toLowerCase();
      const phoneFromAuth = (user.phone ?? "").trim();
      const phoneAuth = authProvider === "phone";
      setIsPhoneAuthUser(phoneAuth);

      const [{ data: profileData }, { data: areaData }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, role, phone, whatsapp_number, profile_photo, preferred_contact_method, current_location, occupation, profile_completed, phone_verified",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("areas").select("id, name").eq("is_active", true).order("name"),
      ]);

      if (!active) return;

      if (areaData) {
        setAreas(areaData);
      }

      if (profileData?.profile_completed) {
        if (profileData.phone_verified) {
          router.replace("/");
        } else {
          router.replace("/profile/verifyphone");
        }
        return;
      }

      if (profileData) {
        const googleAvatar = (user.user_metadata?.avatar_url as string | undefined) ?? "";
        const resolvedPhoto = profileData.profile_photo ?? googleAvatar ?? "";

        setProfile({
          id: user.id,
          full_name: profileData.full_name ?? "",
          role: (profileData.role as ProfileRow["role"]) ?? "renter",
          phone: profileData.phone?.trim() ? profileData.phone : phoneFromAuth,
          whatsapp_number: profileData.whatsapp_number?.trim()
            ? profileData.whatsapp_number
            : phoneFromAuth,
          profile_photo: resolvedPhoto,
          preferred_contact_method:
            (profileData.preferred_contact_method as ProfileRow["preferred_contact_method"]) ??
            "in_app",
          current_location: profileData.current_location ?? "",
          occupation: profileData.occupation ?? "",
          profile_completed: !!profileData.profile_completed,
          phone_verified: !!profileData.phone_verified,
        });

      } else {
        const googleAvatar = (user.user_metadata?.avatar_url as string | undefined) ?? "";
        setProfile((current) => ({
          ...current,
          id: user.id,
          profile_photo: googleAvatar,
          phone: phoneFromAuth || current.phone,
          whatsapp_number: phoneFromAuth || current.whatsapp_number,
        }));
      }

      const [{ data: selectedAreas }, { data: studentData }] = await Promise.all([
        supabase.from("profile_preferred_areas").select("area_id").eq("profile_id", user.id),
        supabase
          .from("student_profiles")
          .select("college, year_of_study, branch")
          .eq("profile_id", user.id)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (selectedAreas?.length) {
        setSelectedAreaIds(selectedAreas.map((item) => item.area_id));
      }

      if (studentData) {
        setStudent({
          college: studentData.college ?? "",
          year_of_study: studentData.year_of_study ?? "",
          branch: studentData.branch ?? "",
        });
      }

      setLoading(false);
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [router]);

  const requiredComplete = useMemo(() => {
    const hasName = profile.full_name.trim().length > 0;
    const hasContact =
      profile.phone.trim().length > 0 || profile.whatsapp_number.trim().length > 0;
    const hasPreferredAreas = selectedAreaIds.length >= MIN_PREFERRED_AREAS;
    return Boolean(profile.role && hasName && hasContact && hasPreferredAreas);
  }, [profile, selectedAreaIds]);

  const progress = useMemo(() => (requiredComplete ? 100 : 75), [requiredComplete]);

  const toggleArea = (areaId: number) => {
    setSelectedAreaIds((current) =>
      current.includes(areaId)
        ? current.filter((value) => value !== areaId)
        : [...current, areaId],
    );
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploadingAvatar(true);

    const extension =
      (file.name.split(".").pop() || "").toLowerCase() || file.type.split("/")[1] || "jpg";
    const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });

    if (uploadError) {
      setUploadingAvatar(false);
      toast.error("Avatar upload failed.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const photoUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: userId, profile_photo: photoUrl });

    setUploadingAvatar(false);
    event.target.value = "";

    if (updateError) {
      toast.error("Avatar saved in storage but profile update failed.");
      return;
    }

    setProfile((current) => ({ ...current, profile_photo: photoUrl }));
    toast.success("Avatar updated.");
  };

  const saveProfile = async () => {
    if (!userId) return;

    if (!requiredComplete) {
      toast.error(
        `Please add role, full name, one contact number, and at least ${MIN_PREFERRED_AREAS} preferred areas.`,
      );
      return;
    }
    if (selectedAreaIds.length < MIN_PREFERRED_AREAS) {
      toast.error(`Please select at least ${MIN_PREFERRED_AREAS} preferred areas.`);
      return;
    }

    setSaving(true);

    const profilePayload = {
      id: userId,
      full_name: profile.full_name.trim(),
      role: profile.role,
      phone: profile.phone.trim() || null,
      whatsapp_number: profile.whatsapp_number.trim() || null,
      profile_photo: profile.profile_photo || null,
      preferred_contact_method: profile.preferred_contact_method,
      current_location: profile.current_location.trim() || null,
      occupation: profile.occupation.trim() || null,
      profile_completed: true,
    };

    const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);
    if (profileError) {
      setSaving(false);
      toast.error(profileError.message || "Could not save profile.");
      return;
    }

    const { error: clearAreasError } = await supabase
      .from("profile_preferred_areas")
      .delete()
      .eq("profile_id", userId);
    if (clearAreasError) {
      setSaving(false);
      toast.error("Could not update preferred areas.");
      return;
    }

    if (selectedAreaIds.length > 0) {
      const rows = selectedAreaIds.map((areaId) => ({
        profile_id: userId,
        area_id: areaId,
      }));
      const { error: insertAreasError } = await supabase
        .from("profile_preferred_areas")
        .insert(rows);
      if (insertAreasError) {
        setSaving(false);
        toast.error("Could not save preferred areas.");
        return;
      }
    }

    if (profile.role === "owner") {
      await supabase.from("student_profiles").delete().eq("profile_id", userId);
      const { error: ownerError } = await supabase
        .from("owner_profiles")
        .upsert({ profile_id: userId });
      if (ownerError) {
        setSaving(false);
        toast.error("Could not save owner profile.");
        return;
      }
    } else {
      await supabase.from("owner_profiles").delete().eq("profile_id", userId);
      const isStudentRenter =
        profile.role === "renter" && profile.occupation.trim().toLowerCase() === "student";

      const studentPayload = isStudentRenter
        ? {
            profile_id: userId,
            college: student.college.trim() || null,
            year_of_study: student.year_of_study.trim() || null,
            branch: student.branch.trim() || null,
          }
        : {
            profile_id: userId,
            college: null,
            year_of_study: null,
            branch: null,
          };

      const { error: studentError } = await supabase
        .from("student_profiles")
        .upsert(studentPayload, { onConflict: "profile_id" });
      if (studentError) {
        setSaving(false);
        toast.error("Could not save student details.");
        return;
      }
    }

    setSaving(false);
    toast.success("Profile saved.");
    router.replace("/profile/verifyphone");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="mr-2" /> Loading profile...
      </div>
    );
  }

  if (authMissing) {
    return (
      <AuthCta
        title="Sign in to create your profile"
        description="Set up your profile to start listing or searching."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.12),transparent_33%),radial-gradient(circle_at_88%_0%,rgba(14,165,233,0.15),transparent_31%),linear-gradient(180deg,var(--background),color-mix(in_oklab,var(--background),var(--muted)_26%))] px-4 py-6 sm:px-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl space-y-5"
      >
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Complete Profile in 1 Minute</span>
              <Badge variant={requiredComplete ? "default" : "secondary"}>{progress}%</Badge>
            </CardTitle>
            <CardDescription>
              Required now: role, full name, one contact number, and at least{" "}
              {MIN_PREFERRED_AREAS} preferred areas.
            </CardDescription>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage src={profile.profile_photo} alt={profile.full_name || "User"} />
                <AvatarFallback>
                  {(profile.full_name?.trim()?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label
                  htmlFor="avatar-upload"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/40"
                >
                  <Camera className="h-4 w-4" />
                  {uploadingAvatar ? "Uploading..." : "Change avatar"}
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploadingAvatar}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <Label>Why are you here? *</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {INTENT_OPTIONS.map(({ role, title, description, Icon, disabled }) => (
                  <button
                    key={role}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      !disabled && setProfile((current) => ({ ...current, role: role }))
                    }
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      "hover:border-primary/50 hover:bg-primary/5",
                      profile.role === role ? "border-primary bg-primary/10" : "border-border bg-card",
                      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {title}
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-2" htmlFor="full_name">Full name *</Label>
                <Input
                  id="full_name"
                  placeholder="Enter full name"
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="mb-2"  htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  placeholder="Phone"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, phone: event.target.value }))
                  }
                  disabled={isPhoneAuthUser}
                />
              </div>
              <div>
                <Label className="mb-2"  htmlFor="whatsapp">WhatsApp number</Label>
                <Input
                  id="whatsapp"
                  placeholder="WhatsApp"
                  value={profile.whatsapp_number}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      whatsapp_number: event.target.value,
                    }))
                  }
                  disabled={isPhoneAuthUser}
                />
              </div>
              {isPhoneAuthUser && (
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  Phone and WhatsApp are locked to your verified login number.
                </p>
              )}
              <div className="sm:col-span-2">
                <Label className="mb-2"  >Preferred contact method</Label>
                <Select
                  value={profile.preferred_contact_method}
                  onValueChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      preferred_contact_method: value as ProfileRow["preferred_contact_method"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 inline-block">
                  Preferred areas ({selectedAreaIds.length} selected, minimum {MIN_PREFERRED_AREAS})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        selectedAreaIds.includes(area.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50",
                      )}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                {requiredComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Minimum completion: role + full name + one contact + {MIN_PREFERRED_AREAS} preferred
                areas.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Optional Details</CardTitle>
            <CardDescription>Add now or skip and complete later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowOptional((current) => !current)}
            >
              {showOptional ? "Hide optional fields" : "Show optional fields"}
            </Button>

            {showOptional && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Current location"
                    value={profile.current_location}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        current_location: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Occupation"
                    value={profile.occupation}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, occupation: event.target.value }))
                    }
                  />
                </div>

                {profile.role === "renter" &&
                  profile.occupation.trim().toLowerCase() === "student" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input
                        placeholder="College"
                        value={student.college}
                        onChange={(event) =>
                          setStudent((current) => ({ ...current, college: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Year of study"
                        value={student.year_of_study}
                        onChange={(event) =>
                          setStudent((current) => ({
                            ...current,
                            year_of_study: event.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Branch"
                        value={student.branch}
                        onChange={(event) =>
                          setStudent((current) => ({ ...current, branch: event.target.value }))
                        }
                      />
                    </div>
                  )}

              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="h-11 rounded-xl px-6" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save and Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
