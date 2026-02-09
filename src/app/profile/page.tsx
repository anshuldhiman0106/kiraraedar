"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  User,
  Phone,
  SlidersHorizontal,
  UserPlus,
  Home,
  Users,
  Upload,
  CheckCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ComboboxGroup } from "@base-ui/react";
import { PhoneInput } from "@/components/phone-input";

/* -------------------------------------------------------
   TYPES - ALL PROFILE TABLE FIELDS [file:149]
------------------------------------------------------- */
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
  owner_since_months?: number;
  verified_landlord?: boolean;
  roommate_budget_min?: number;
  roommate_budget_max?: number;
  gender_preference?: string;
  roommate_count_pref?: number;
  food_habits?: string;
  wake_up_time?: string;
  preferred_areas?: string[];
  current_location?: string;
  avg_rating?: number;
  total_reviews?: number;
  verified_student?: boolean;
  profile_completed?: boolean;
  bio?: string;
};

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */
export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchProfile();
  }, []);

  /* ---------------- DATA FUNCTIONS ---------------- */
  const fetchProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    setProfile(profileData ?? { id: data.user.id });

    if (profileData?.profile_completed) {
      if (!profileData.phone_verified) {
        router.push("/profile/verifyphone");
        return;
      } else {
      router.push("/" );

      return;}
    }

    setLoading(false);
  };

  const anchor = useComboboxAnchor();

  const updateProfile = async (field: keyof Profile, value: any) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    await supabase.from("profiles").upsert(updated);
  };

  /* ---------------- AVATAR UPLOAD ---------------- */
  const uploadAvatar = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (!error) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        await updateProfile("profile_photo", data.publicUrl);
        toast.success("Avatar uploaded!");
      } else {
        toast.error("Upload failed");
      }
      setUploading(false);
    },
    [profile.id],
  );

  /* ---------------- VALIDATION ---------------- */
  const isComplete = () => {
    const required = [
      profile.full_name,
      profile.current_location,
      profile.preferred_areas,
      profile.gender,
      profile.role,
    ];
    return required.every(Boolean);
  };

  const completionPercentage = () => {
    const fields = [
      profile.full_name,
      profile.gender,
      profile.phone,
      profile.whatsapp_number,
      profile.role,
      profile.current_location,
      profile.preferred_areas,
      profile.profile_photo,
      profile.phone_verified,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const indianPhone = (value: string) => `+91${value.replace(/\D/g, "")}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto space-y-6"
      >
        
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
        

        {/* PROFILE STRENGTH */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile strength</span>
              <Badge>{completionPercentage()}%</Badge>
            </div>
            <Progress value={completionPercentage()} />
          </CardContent>
        </Card>

        {/* AVATAR UPLOAD */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.profile_photo} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload size={16} />
                {uploading ? "Uploading..." : "Change photo"}
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* MAIN FORM */}
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>
              Complete all fields to start searching
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* BASIC TAB */}
              <TabsContent value="basic" className="space-y-8">
                {/* Basic Info Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Basic Information
                  </h3>

                  {/* Full Name */}
                  <Input
                    placeholder="Full name *"
                    value={profile.full_name ?? ""}
                    onChange={(e) => updateProfile("full_name", e.target.value)}
                  />

                  {/*Gender*/}
                  <div>
                    <Select
                      value={profile.gender ?? ""}
                      onValueChange={(v) => updateProfile("gender", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your gender    *" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Gender</SelectLabel>

                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role */}
                  <Select
                    value={profile.role ?? ""}
                    onValueChange={(v) => updateProfile("role", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Role</SelectLabel>
                        <SelectItem value="renter">
                          🧑‍🎓 Renter (Student)
                        </SelectItem>
                        <SelectItem value="owner">🏠 Owner</SelectItem>
                        <SelectItem value="other">
                          💼 Working Professional
                        </SelectItem>
                        <SelectItem value="roommate_seeker">
                          🧑‍🤝‍🧑 Roommate Seeker
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Current Location"
                    value={profile.current_location ?? ""}
                    onChange={(e) =>
                      updateProfile("current_location", e.target.value)
                    }
                  />

                  {/* Preferred Areas 
                   Combobox with multi-select and free input for preferred areas */}
                  <Combobox
                    multiple
                    autoHighlight
                    value={profile.preferred_areas ?? []}
                    onValueChange={(v) => updateProfile("preferred_areas", v)}
                    items={[
                      "Shyam Nagar",
                      "McLeod Ganj",
                      "Dharamkot",
                      "Naddi",
                      "Bhagsu",
                    ]}
                  >
                    {/* ✅ Chips UI */}

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

                    {/* ✅ Dropdown */}
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

                {/* Renter Section */}
                {profile.role === "renter" && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold">Student Details</h3>
                      <p className="text-xs text-muted-foreground">
                        This helps us show you relevant rooms
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                      {/* College */}
                      <div className="col-span-full">
                        <Select
                          disabled
                          value={profile.college ?? ""}
                          onValueChange={(v) => updateProfile("college", v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="College *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Govt College Dharamshala">
                              Govt. College Dharamshala
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Branch */}
                      <div className="col-span-1">
                        <Select
                          value={profile.branch ?? ""}
                          onValueChange={(v) => updateProfile("branch", v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Branch *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Branch</SelectLabel>
                              <SelectItem value="CS">
                                Computer Science
                              </SelectItem>
                              <SelectItem value="BCA">BCA</SelectItem>
                              <SelectItem value="BT">Biotech</SelectItem>
                              <SelectItem value="BA">BA</SelectItem>
                              <SelectItem value="BSC">BSc</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Year */}
                      <div className="col-span-1">
                        <Select
                          value={profile.year_of_study ?? ""}
                          onValueChange={(v) =>
                            updateProfile("year_of_study", v)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Year of study *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Year of Study</SelectLabel>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {
                  /*Roommate Seeker Section */
                  profile.role === "roommate_seeker" && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Roommate Preferences
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          This helps us find you compatible roommates
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div>
                          <Select
                            value={profile.gender_preference ?? ""}
                            onValueChange={(v) =>
                              updateProfile("gender_preference", v)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Gender preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Gender Preference</SelectLabel>
                                <SelectItem value="girls">
                                  Girls only
                                </SelectItem>
                                <SelectItem value="male">Boys only</SelectItem>
                                <SelectItem value="mixed">Mixed</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Select
                            value={profile.wake_up_time ?? ""}
                            onValueChange={(v) =>
                              updateProfile("wake_up_time", v)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Wake up time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Wake Up Time</SelectLabel>
                                <SelectItem value="early">
                                  Early (before 7am)
                                </SelectItem>
                                <SelectItem value="late">
                                  Late (after 9am)
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Select
                            value={profile.food_habits ?? ""}
                            onValueChange={(v) =>
                              updateProfile("food_habits", v)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Food habits" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Food Habits</SelectLabel>
                                <SelectItem value="veg">Vegetarian</SelectItem>
                                <SelectItem value="non-veg">
                                  Non-vegetarian
                                </SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Select
                            value={
                              profile.roommate_count_pref?.toString() ?? ""
                            }
                            onValueChange={(v) =>
                              updateProfile("roommate_count_pref", Number(v))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Roommate count preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  Roommate Count Preference
                                </SelectLabel>
                                <SelectItem value="0">No preference</SelectItem>
                                <SelectItem value="1">1 roommate</SelectItem>
                                <SelectItem value="2">2 roommates</SelectItem>
                                <SelectItem value="3">3 roommates</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )
                }
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* SMART SUBMIT BUTTON */}
          <div className="p-6 pt-0">
            <Button
              onClick={() =>
                updateProfile("profile_completed", true).then(() => {
                  toast.success(
                    "Profile completed! Redirecting to verify phone...",
                  );
                  router.push(`${window.location.href.replace('#', '')}/verifyphone`);
                })
              }
              className="w-full"
              disabled={!isComplete()}
            >
              {isComplete() ? (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Complete! Start Searching Rooms
                </>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  Complete all fields first ({completionPercentage()}%)
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
