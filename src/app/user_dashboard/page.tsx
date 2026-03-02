"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Home,
  Users,
  Bed,
  DollarSign,
  Shield,
  Edit,
  Plus,
  MapPin,
  CheckCircle,
  BarChart3,
  Settings,
  Check,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AddProperty from "@/components/AddProperty";

type Property = {
  id: string
  title: string
  rent: number
  deposit?: number
  address: string
  area?: string
  gender?: string
  capacity?: string
  available: boolean
  furnished?: boolean
  near_college?: boolean
  views: number
  inquiries: number
  images?: string[]
}

type Profile = {
  id?: string
  role?: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  current_location?: string | null
  bio?: string | null
  profile_photo?: string | null
  subscription_status?: string | null
}

export default function UniversalDashboard() {
  const [profile, setProfile] = useState<Profile>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);
    console.log("Profile Data:", profileData);

    if (profileData?.role === "owner") {
      // Fetch from NEW properties table
      const { data: propData } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setProperties(propData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      await fetchData();
    };

    void run();
  }, []);

  const updateProfile = async <K extends keyof Profile>(field: K, value: Profile[K]) => {
    const updates = { ...profile, [field]: value };
    setProfile(updates);
    await supabase.from("profiles").upsert(updates);
    toast.success("Profile updated!");
  };

 const uploadImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = []
  
  for (const file of files) {
    // UNIQUE filename: ownerId-timestamp-random.jpg
    const fileExt = file.name.split('.').pop()
    const fileName = `properties/${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // 1️⃣ UPLOAD to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('room-images')  // ← YOUR BUCKET NAME
      .upload(fileName, file, {
        cacheControl: '3600',  // Cache 1 hour
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      continue
    }
    
    // 2️⃣ GET PUBLIC URL
    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(fileName)
    
    urls.push(publicUrl)
  }
  
  return urls
}
  void uploadImages


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* HEADER - Your Logo Style */}
      <div className="bg-card/20 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center rounded-xlshadow-xl">
                <img src="logo.svg" alt="" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text">
                  Kiraedar
                </h1>
                <p className="text-muted-foreground text-lg capitalize">
                  {profile.role} Dashboard
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline" className="h-12 px-8 rounded-xl">
                  <Home className="h-5 w-5 mr-2" />
                  Browse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR - Your Style */}
          <div className="lg:col-span-1 space-y-6">
            <div className="grid grid-cols-1 w-full bg-card/50 backdrop-blur-xl rounded-2xl p-2 shadow-xl">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                className="h-16 rounded-xl justify-start data-[state=on]:bg-primary/90"
                onClick={() => setActiveTab("overview")}
              >
                <BarChart3 className="h-5 w-5 mr-3" /> Overview
              </Button>
              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="h-16 rounded-xl justify-start data-[state=on]:bg-primary/90"
                onClick={() => setActiveTab("profile")}
              >
                <Edit className="h-5 w-5 mr-3" /> Profile
              </Button>
              {profile.role === "owner" && (
                <>
                  <Button
                    variant={activeTab === "rooms" ? "default" : "ghost"}
                    className="h-16 rounded-xl justify-start data-[state=on]:bg-primary/90"
                    onClick={() => setActiveTab("rooms")}
                  >
                    <Bed className="h-5 w-5 mr-3" /> Properties
                  </Button>
                  <Button
                    variant={activeTab === "analytics" ? "default" : "ghost"}
                    className="h-16 rounded-xl justify-start data-[state=on]:bg-primary/90"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <BarChart3 className="h-5 w-5 mr-3" /> Analytics
                  </Button>
                </>
              )}
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="h-16 rounded-xl justify-start data-[state=on]:bg-primary/90"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-5 w-5 mr-3" /> Settings
              </Button>
            </div>

            {/* STATS CARDS */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/30 backdrop-blur-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6 cursor-pointer">
                  <div className="text-3xl font-black text-emerald-400">
                    {profile.role === "owner" ? properties.length : "98%"}
                  </div>
                  <p className="text-sm text-emerald-300 mt-1">
                    {profile.role === "owner"
                      ? "Active Properties"
                      : "Profile Complete"}
                  </p>
                </CardContent>
              </Card>

              {profile.role === "owner" && (
                <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30 backdrop-blur-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-6 cursor-pointer">
                    <div className="text-3xl font-black text-blue-400">
                      {properties.reduce((sum, p) => sum + p.views, 0)}
                    </div>
                    <p className="text-sm text-blue-300 mt-1">Total Views</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* OVERVIEW - Your Style */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/50">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Plan Status</h3>
                          <p className="text-sm text-muted-foreground">
                            Your subscription
                          </p>
                        </div>
                      </div>
                      {profile.subscription_status === "active" ? (
                        <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                          Active - Featured Owner
                        </Badge>
                      ) : (
                        <Badge className="text-lg px-6 py-3 bg-red-500/50 text-white">
                          Inactive - Basic Plan
                        </Badge>
                      )}
                      {profile.subscription_status !== "active" ? (
                        <p className="text-sm text-muted-foreground mt-3">
                          Upgrade to get featured listings and more leads!
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-3">
                          Next payment: Mar 1st, 2026
                        </p>
                      )}
                      {profile.subscription_status == "active" ? (
                        <Button className="mt-4 w-full h-12 rounded-xl">
                          Manage Subscription
                        </Button>
                      ) : (
                        <Button className="mt-4 w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                          Buy Premium
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/50">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">Earnings</h3>
                          <p className="text-sm text-muted-foreground">
                            This month
                          </p>
                        </div>
                      </div>
                      <div className="text-4xl font-black text-emerald-500 mb-2">
                        ₹24,750
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-400 mb-6">
                        <CheckCircle className="h-4 w-4" />
                        12 leads converted
                      </div>
                      <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600">
                        View Payouts
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* PROFILE - Your Style with Avatar */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/50">
                  <CardContent className="p-8">
                    <h3 className="text-3xl font-bold mb-8">Update Profile</h3>
                    
                    {/* Avatar Section */}
                    <div className="py-7 mb-4 gap-3 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-border/50">
                        {profile.profile_photo ? (
                          <img
                            src={profile.profile_photo}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-16 w-16 text-slate-400" />
                        )}
                      </div>
                      <Label
                        htmlFor="avatar-upload"
                        className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-4 py-2 rounded-xl"
                      >
                        <Upload size={16} />
                        Change Avatar
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        <Input
                          placeholder="Full Name"
                          value={profile.full_name || ""}
                          onChange={(e) =>
                            updateProfile("full_name", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <Input
                          type="email"
                          disabled={true}
                          placeholder="Email"
                          value={profile.email || ""}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone Number
                        </label>
                        <Input
                          disabled={true}
                          placeholder="Phone"
                          value={profile.phone?.replace("+91", "") || ""}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Current Location
                        </label>
                        <Input
                          placeholder="Current Location"
                          value={profile.current_location || ""}
                          onChange={(e) =>
                            updateProfile("current_location", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Role
                        </label>
                        <Select
                          value={profile.role || ""}
                          onValueChange={(v) => updateProfile("role", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="renter">
                              Student/Renter
                            </SelectItem>
                            <SelectItem value="owner">
                              Property Owner
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      className="mt-8 h-32"
                      placeholder="About me (visible to matches)"
                      value={profile.bio || ""}
                      onChange={(e) => updateProfile("bio", e.target.value)}
                    />
                    <Button className="mt-6 w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-lg">
                      <Check className="h-5 w-5 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PROPERTIES (Owner Only) - NEW properties table */}
            {activeTab === "rooms" && profile.role === "owner" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Add Property Form - FULL properties table */}

                 <AddProperty >
                  <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30 backdrop-blur-xl hover:bg- hover:shadow-2xl transition-all cursor-pointer :hover:bg-emerald-400/30 border-emerald-400/50">
                    <CardContent className="  flex items-center justify-center">
                      <h3 className="text-3xl text-blue-300 h-full text-center flex-col font-bold mb-8 flex items-center  gap-3">
                        <Plus className="h-8 w-8" />
                        Add New Property
                      </h3>
                     </CardContent>
                  </Card>


                </AddProperty>

               

                {/* Properties Grid */}
                <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/50">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Your Active Properties ({properties.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.slice(0, 6).map((property: Property) => (
                        <Card key={property.id} className="bg-card/30 backdrop-blur-xl hover:shadow-xl transition-all border-border/30">
                          <div className="h-54 overflow-hidden rounded-t-xl flex items-end ">
                            <img
                                src={property.images?.[0] || "/placeholder.png"}
                                alt={property.title}
                                className="size-full object-cover "
                              />
                          </div>
                          <CardContent className="p-6">
                            <Badge className=" bg-primary/90 backdrop-blur-sm mb-2">
                              {property.available ? "Available" : "Booked"}
                            </Badge>
                            <h4 className="font-bold text-xl mb-3 line-clamp-1">{property.title}</h4>
                            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {property.address}
                            </div>
                            <div className="text-2xl font-black text-primary mb-4">₹{property.rent}</div>
                            <div className="text-xs text-muted-foreground mb-6">
                              {property.area} • {property.capacity} • {property.gender}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-11 flex-1 rounded-xl">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button size="sm" className="h-11 flex-1 rounded-xl bg-primary/90">
                                View Stats
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
