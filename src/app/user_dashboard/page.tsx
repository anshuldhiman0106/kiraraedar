"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BarChart3,
  Bed,
  Clock3,
  DollarSign,
  Edit,
  Eye,
  Home,
  MapPin,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AddProperty = dynamic(() => import("@/components/AddProperty"), {
  ssr: false,
});

type Property = {
  id: string;
  title: string;
  rent: number;
  deposit?: number;
  address: string;
  area?: string;
  gender?: string;
  capacity?: string;
  available: boolean;
  furnished?: boolean;
  bed_count?: number | null;
  electricity_included?: boolean;
  water_included?: boolean;
  wifi_included?: boolean;
  attached_bathroom?: boolean;
  parking_available?: boolean;
  laundry_available?: boolean;
  kitchen_available?: boolean;
  other_facilities?: string | null;
  near_college?: boolean;
  views: number;
  inquiries: number;
  images?: string[];
};

type Profile = {
  id?: string;
  role?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  current_location?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  subscription_status?: string | null;
  verified_landlord?: boolean | null;
  occupation?: string | null;
  preferred_contact_method?: string | null;
};

type StudentProfile = {
  college: string;
  year_of_study: string;
  branch: string;
};

type Area = {
  id: number;
  name: string;
};

type DashboardTab = "overview" | "profile" | "rooms" | "analytics" | "settings";
const OWNER_PLAN_PRICE_INR = 100;
const MIN_PREFERRED_AREAS = 5;

type PropertyEditDraft = {
  id: string;
  title: string;
  rent: number;
  deposit: number;
  address: string;
  area: string | null;
  capacity: string | null;
  gender: string | null;
  available: boolean;
  furnished: boolean;
  bed_count: number;
  electricity_included: boolean;
  water_included: boolean;
  wifi_included: boolean;
  attached_bathroom: boolean;
  parking_available: boolean;
  laundry_available: boolean;
  kitchen_available: boolean;
  other_facilities: string;
  near_college: boolean;
};

const toEditDraft = (property: Property): PropertyEditDraft => ({
  id: property.id,
  title: property.title,
  rent: property.rent,
  deposit: property.deposit ?? 0,
  address: property.address,
  area: property.area ?? null,
  capacity: property.capacity ?? null,
  gender: property.gender ?? null,
  available: property.available,
  furnished: !!property.furnished,
  bed_count: property.bed_count ?? 1,
  electricity_included: !!property.electricity_included,
  water_included: !!property.water_included,
  wifi_included: !!property.wifi_included,
  attached_bathroom: !!property.attached_bathroom,
  parking_available: !!property.parking_available,
  laundry_available: !!property.laundry_available,
  kitchen_available: !!property.kitchen_available,
  other_facilities: property.other_facilities ?? "",
  near_college: !!property.near_college,
});

export default function UniversalDashboard() {
  const [profile, setProfile] = useState<Profile>({});
  const isOwner = profile.role === "owner";
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [actionPropertyId, setActionPropertyId] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<PropertyEditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContactPreference, setSavingContactPreference] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    college: "",
    year_of_study: "",
    branch: "",
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as typeof window & { Razorpay?: unknown }).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [
      { data: profileData },
      { data: ownerProfile },
      { data: studentData },
      { data: areasData },
      { data: selectedAreasData },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("owner_profiles")
        .select("verified_landlord")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("student_profiles")
        .select("college, year_of_study, branch")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("areas")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("profile_preferred_areas")
        .select("area_id")
        .eq("profile_id", user.id),
    ]);

    setProfile({
      ...(profileData || {}),
      verified_landlord: !!ownerProfile?.verified_landlord,
    });
    setStudentProfile({
      college: studentData?.college ?? "",
      year_of_study: studentData?.year_of_study ?? "",
      branch: studentData?.branch ?? "",
    });
    setAreas((areasData ?? []) as Area[]);
    setSelectedAreaIds((selectedAreasData ?? []).map((item) => item.area_id));

    const { data: propData } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setProperties(propData || []);
    setActiveTab(profileData?.role === "owner" ? "overview" : "rooms");

    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (profile.role !== "owner" || !profile.id) {
      return
    }

    const channel = supabase
      .channel(`owner-properties-live-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "properties",
          filter: `owner_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id
            if (!deletedId) {
              return
            }
            setProperties((current) => current.filter((property) => property.id !== deletedId))
            return
          }

          const incoming = payload.new as Property
          if (!incoming?.id) {
            return
          }

          setProperties((current) => {
            const exists = current.some((property) => property.id === incoming.id)
            if (!exists) {
              return [incoming, ...current]
            }
            return current.map((property) => (property.id === incoming.id ? { ...property, ...incoming } : property))
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profile.id, profile.role])

  const updateProfile = async <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const togglePreferredArea = (areaId: number) => {
    setSelectedAreaIds((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
  };

  const handleSaveProfile = async () => {
    if (!profile.id) {
      toast.error("Please login again.");
      return;
    }

    setSavingProfile(true);

    if (selectedAreaIds.length < MIN_PREFERRED_AREAS) {
      setSavingProfile(false);
      toast.error(`Please select at least ${MIN_PREFERRED_AREAS} preferred areas.`);
      return;
    }

    const profilePayload = {
      id: profile.id,
      role: profile.role ?? null,
      full_name: profile.full_name ?? null,
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      current_location: profile.current_location ?? null,
      bio: profile.bio ?? null,
      profile_photo: profile.profile_photo ?? null,
      subscription_status: profile.subscription_status ?? null,
      occupation: profile.occupation ?? null,
      preferred_contact_method: profile.preferred_contact_method ?? "in_app",
    };

    const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);
    if (profileError) {
      setSavingProfile(false);
      toast.error("Failed to save profile");
      return;
    }

    const isStudentRenter =
      profile.role === "renter" && (profile.occupation ?? "").trim().toLowerCase() === "student";

    if (isStudentRenter) {
      const { error: studentError } = await supabase.from("student_profiles").upsert(
        {
          profile_id: profile.id,
          college: studentProfile.college.trim() || null,
          year_of_study: studentProfile.year_of_study.trim() || null,
          branch: studentProfile.branch.trim() || null,
        },
        { onConflict: "profile_id" },
      );
      if (studentError) {
        setSavingProfile(false);
        toast.error("Failed to save student details");
        return;
      }
    }

    const { error: clearAreasError } = await supabase
      .from("profile_preferred_areas")
      .delete()
      .eq("profile_id", profile.id);
    if (clearAreasError) {
      setSavingProfile(false);
      toast.error("Failed to update preferred areas");
      return;
    }

    if (selectedAreaIds.length > 0) {
      const rows = selectedAreaIds.map((areaId) => ({
        profile_id: profile.id!,
        area_id: areaId,
      }));
      const { error: insertAreasError } = await supabase
        .from("profile_preferred_areas")
        .insert(rows);
      if (insertAreasError) {
        setSavingProfile(false);
        toast.error("Failed to save preferred areas");
        return;
      }
    }

    setSavingProfile(false);
    toast.success("Profile updated");
  };

  const handleSaveContactPreference = async () => {
    if (!profile.id) {
      toast.error("Please login again.");
      return;
    }

    if (profile.role !== "owner") {
      toast.error("This setting is only available for owners.");
      return;
    }

    setSavingContactPreference(true);

    const { error } = await supabase
      .from("profiles")
      .update({ preferred_contact_method: profile.preferred_contact_method ?? "phone" })
      .eq("id", profile.id);

    setSavingContactPreference(false);

    if (error) {
      toast.error("Failed to update contact preference.");
      return;
    }

    toast.success("Contact preference updated.");
  };

  const handleToggleAvailability = async (property: Property) => {
    if (!profile.id) {
      toast.error("Please login again.");
      return;
    }

    const nextValue = !property.available;
    setActionPropertyId(property.id);

    const { error } = await supabase
      .from("properties")
      .update({ available: nextValue })
      .eq("id", property.id)
      .eq("owner_id", profile.id);

    setActionPropertyId(null);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    setProperties((current) =>
      current.map((item) => (item.id === property.id ? { ...item, available: nextValue } : item)),
    );
    toast.success(nextValue ? "Property marked available" : "Property marked booked");
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!profile.id) {
      toast.error("Please login again.");
      return;
    }

    setActionPropertyId(propertyId);

    try {
      // First, fetch the property to get image URLs
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("images")
        .eq("id", propertyId)
        .eq("owner_id", profile.id)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        toast.error("Failed to fetch property details");
        setActionPropertyId(null);
        return;
      }

      console.log("Property images:", property?.images);

      // Delete images from storage if they exist
      if (property?.images && Array.isArray(property.images) && property.images.length > 0) {
        const imagePaths = property.images
          .map((url: string) => {
            // Extract the storage path from the public URL
            // URL format: https://{project}.supabase.co/storage/v1/object/public/room-images/{path}
            // We need to extract everything after "room-images/"
            const match = url.match(/\/room-images\/(.+?)(?:\?|$)/);
            const path = match ? match[1] : null;
            console.log("URL:", url, "-> Path:", path);
            return path;
          })
          .filter((path): path is string => path !== null);

        console.log("Paths to delete:", imagePaths);

        if (imagePaths.length > 0) {
          const { data: deleteData, error: storageError } = await supabase.storage
            .from("room-images")
            .remove(imagePaths);

          console.log("Storage delete result:", { data: deleteData, error: storageError });

          if (storageError) {
            console.error("Failed to delete images from storage:", storageError);
            toast.error("Failed to delete images, but continuing with property deletion");
            // Continue with property deletion even if image deletion fails
          } else {
            console.log("Successfully deleted images from storage");
          }
        }
      }

      // Delete the property from database
      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("owner_id", profile.id);

      setActionPropertyId(null);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        toast.error("Failed to delete property");
        return;
      }

      setProperties((current) => current.filter((item) => item.id !== propertyId));
      toast.success("Property and images deleted successfully");
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("An error occurred while deleting the property");
      setActionPropertyId(null);
    }
  };

  const handleSavePropertyEdit = async () => {
    if (!editingProperty || !profile.id) {
      return;
    }

    if (!editingProperty.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editingProperty.address.trim()) {
      toast.error("Address is required");
      return;
    }

    if (editingProperty.rent < 2000 || editingProperty.rent > 50000) {
      toast.error("Rent must be between Rs 2000 and Rs 50000");
      return;
    }

    if (editingProperty.deposit < 0 || editingProperty.deposit > 45000) {
      toast.error("Deposit must be between Rs 0 and Rs 45000");
      return;
    }

    if (editingProperty.bed_count < 1 || editingProperty.bed_count > 12) {
      toast.error("Bed count must be between 1 and 12");
      return;
    }

    setSavingEdit(true);

    const payload = {
      title: editingProperty.title.trim(),
      rent: editingProperty.rent,
      deposit: editingProperty.deposit,
      address: editingProperty.address.trim(),
      area: editingProperty.area,
      capacity: editingProperty.capacity,
      gender: editingProperty.gender,
      available: editingProperty.available,
      furnished: editingProperty.furnished,
      bed_count: editingProperty.bed_count,
      electricity_included: editingProperty.electricity_included,
      water_included: editingProperty.water_included,
      wifi_included: editingProperty.wifi_included,
      attached_bathroom: editingProperty.attached_bathroom,
      parking_available: editingProperty.parking_available,
      laundry_available: editingProperty.laundry_available,
      kitchen_available: editingProperty.kitchen_available,
      other_facilities: editingProperty.other_facilities.trim() || null,
      near_college: editingProperty.near_college,
    };

    const { error } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", editingProperty.id)
      .eq("owner_id", profile.id);

    setSavingEdit(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    setProperties((current) =>
      current.map((item) => (item.id === editingProperty.id ? { ...item, ...payload } : item)),
    );
    setEditingProperty(null);
    toast.success("Property updated");
  };

  const handleUpgradePlan = async () => {
    if (profile.subscription_status === "active") {
      toast.message("Your premium plan is already active.");
      return;
    }

    setUpgradingPlan(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Please login again to continue.");
        return;
      }

      const createOrderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!createOrderResponse.ok) {
        const errorData = (await createOrderResponse.json().catch(() => null)) as { error?: string } | null;
        toast.error(errorData?.error || "Unable to start payment.");
        return;
      }

      const orderData = (await createOrderResponse.json()) as {
        key: string;
        orderId: string;
        amount: number;
        currency: string;
        planName: string;
      };

      type RazorpayHandlerResponse = {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      type RazorpayOptions = {
        key: string;
        amount: number;
        currency: string;
        name: string;
        description: string;
        order_id: string;
        prefill: { name?: string; email?: string; contact?: string };
        notes: { plan: string };
        theme: { color: string };
        handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
      };

      const RazorpayCtor = (window as Window & { Razorpay: new (options: RazorpayOptions) => { open: () => void } }).Razorpay;

      const razorpay = new RazorpayCtor({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Kiraedar",
        description: orderData.planName,
        order_id: orderData.orderId,
        prefill: {
          name: profile.full_name || "",
          email: profile.email || "",
          contact: profile.phone || "",
        },
        notes: {
          plan: orderData.planName,
        },
        theme: {
          color: "#10b981",
        },
        handler: async (response) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(response),
          });

          if (!verifyResponse.ok) {
            toast.error("Payment verification failed.");
            return;
          }

          const verifyData = (await verifyResponse.json()) as {
            success: boolean;
            subscription_status?: string;
            verified_landlord?: boolean;
          };

          if (!verifyData.success) {
            toast.error("Payment verification failed.");
            return;
          }

          setProfile((current) => ({
            ...current,
            subscription_status: verifyData.subscription_status ?? "active",
            verified_landlord: verifyData.verified_landlord ?? true,
          }));

          toast.success("Plan activated. Verified landlord tag enabled.");
        },
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      toast.error("Could not complete the payment flow.");
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handlePropertyAdded = (property: Property) => {
    setProperties((current) => {
      const exists = current.some((item) => item.id === property.id);
      if (exists) {
        return current.map((item) => (item.id === property.id ? { ...item, ...property } : item));
      }
      return [property, ...current];
    });
  };

  const totalViews = useMemo(
    () => properties.reduce((sum, property) => sum + (property.views || 0), 0),
    [properties],
  );

  const totalInquiries = useMemo(
    () => properties.reduce((sum, property) => sum + (property.inquiries || 0), 0),
    [properties],
  );

  const averageRent = useMemo(() => {
    if (!properties.length) {
      return 0;
    }

    return Math.round(properties.reduce((sum, property) => sum + property.rent, 0) / properties.length);
  }, [properties]);

  const occupancyRate = useMemo(() => {
    if (!properties.length) {
      return 0;
    }

    const occupied = properties.filter((property) => !property.available).length;
    return Math.round((occupied / properties.length) * 100);
  }, [properties]);

  const topProperties = useMemo(
    () => [...properties].sort((a, b) => b.inquiries - a.inquiries).slice(0, 5),
    [properties],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card">
              <img src="/logo.svg" alt="Kiraedar logo" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Kiraedar</h1>
              <p className="text-xs text-muted-foreground capitalize">{profile.role || "user"} dashboard</p>
            </div>
          </div>

          <Link href="/">
            <Button variant="outline" className="h-10 rounded-xl px-4">
              <Home className="mr-2 h-4 w-4" />
              Browse
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:py-8">
        <aside className="space-y-4 lg:col-span-1">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="grid gap-1 p-2">
              {isOwner ? (
                <>
                  <Button variant={activeTab === "overview" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("overview")}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Overview
                  </Button>
                  <Button variant={activeTab === "profile" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("profile")}>
                    <Edit className="mr-2 h-4 w-4" /> Profile
                  </Button>
                  <Button variant={activeTab === "rooms" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("rooms")}>
                    <Bed className="mr-2 h-4 w-4" /> Properties
                  </Button>
                  <Button variant={activeTab === "analytics" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("analytics")}>
                    <TrendingUp className="mr-2 h-4 w-4" /> Analytics
                  </Button>
                  <Button variant={activeTab === "settings" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button variant={activeTab === "profile" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("profile")}>
                    <Edit className="mr-2 h-4 w-4" /> Profile
                  </Button>
                  <Button variant={activeTab === "rooms" ? "default" : "ghost"} className="justify-start rounded-xl" onClick={() => setActiveTab("rooms")}>
                    <Bed className="mr-2 h-4 w-4" /> Manage Properties
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/10 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Active properties</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{properties.length}</p>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6 lg:col-span-3">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Total Views</span><Eye className="h-4 w-4" /></div><p className="mt-2 text-3xl font-semibold">{totalViews}</p></CardContent></Card>
                <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Inquiries</span><MessageSquare className="h-4 w-4" /></div><p className="mt-2 text-3xl font-semibold">{totalInquiries}</p></CardContent></Card>
                <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Avg Rent</span><DollarSign className="h-4 w-4" /></div><p className="mt-2 text-3xl font-semibold">Rs {averageRent}</p></CardContent></Card>
                <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Occupancy</span><TrendingUp className="h-4 w-4" /></div><p className="mt-2 text-3xl font-semibold">{occupancyRate}%</p></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                
                {profile.role === "owner" && (
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white"><Shield className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-semibold">Plan Status</h3>
                        <p className="text-sm text-muted-foreground">Subscription and visibility controls</p>
                      </div>
                    </div>
                    {profile.subscription_status === "active" ? <Badge className="bg-emerald-600 text-white">Active - Featured Owner</Badge> : <Badge variant="destructive">Inactive - Basic Plan</Badge>}
                    {profile.verified_landlord && <Badge className="ml-2 bg-blue-600 text-white">Verified Landlord</Badge>}
                    <p className="mt-3 text-sm text-muted-foreground">{profile.subscription_status === "active" ? "Priority placement is enabled." : "Upgrade to boost listing visibility and lead conversion."}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">Plan price: Rs {OWNER_PLAN_PRICE_INR}</p>
                    <Button className="mt-4 h-10 rounded-lg" onClick={handleUpgradePlan} disabled={upgradingPlan}>
                      {upgradingPlan
                        ? "Processing..."
                        : profile.subscription_status === "active"
                          ? "Manage Subscription"
                          : `Upgrade Plan - Rs ${OWNER_PLAN_PRICE_INR}`}
                    </Button>
                  </CardContent>
                </Card>
                  
                )}
                

                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="mb-4 font-semibold">Quick Actions</h3>
                    <div className="space-y-3">
                      <AddProperty onPropertyAdded={handlePropertyAdded}>
                        <Button variant="outline" className="h-11 w-full justify-start rounded-lg"><Plus className="mr-2 h-4 w-4" />Add New Property</Button>
                      </AddProperty>
                      <Button variant="outline" className="h-11 w-full justify-start rounded-lg" onClick={() => setActiveTab("rooms")}><Bed className="mr-2 h-4 w-4" />Manage Properties</Button>
                      <Button variant="outline" className="h-11 w-full justify-start rounded-lg" onClick={() => setActiveTab("analytics")}><BarChart3 className="mr-2 h-4 w-4" />Open Analytics</Button>
                    </div>
                  </CardContent>
                </Card>

                {profile.role === "owner" && (
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold">Lead Contact Preference</h3>
                        <p className="text-sm text-muted-foreground">
                          Choose how renters should contact you from property detail page.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Preferred contact method</p>
                        <Select
                          value={profile.preferred_contact_method || "phone"}
                          onValueChange={(v) => updateProfile("preferred_contact_method", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Preferred contact method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp Message</SelectItem>         
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="h-10 rounded-lg"
                        onClick={handleSaveContactPreference}
                        disabled={savingContactPreference}
                      >
                        {savingContactPreference ? "Saving..." : "Save Contact Preference"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/60 shadow-sm">
                <CardHeader><CardTitle>Update Profile</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2"><p className="text-sm text-muted-foreground">Full Name</p><Input value={profile.full_name || ""} onChange={(e) => updateProfile("full_name", e.target.value)} /></div>
                    <div className="space-y-2"><p className="text-sm text-muted-foreground">Email</p><Input disabled value={profile.email || ""} /></div>
                    <div className="space-y-2"><p className="text-sm text-muted-foreground">Phone</p><Input disabled value={profile.phone?.replace("+91", "") || ""} /></div>
                    <div className="space-y-2"><p className="text-sm text-muted-foreground">Current Location</p><Input value={profile.current_location || ""} onChange={(e) => updateProfile("current_location", e.target.value)} /></div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Why are you here?</p>
                      <Select  disabled value={profile.role || ""} onValueChange={(v) => updateProfile("role", v)}>
                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">List room</SelectItem>
                          <SelectItem value="renter">Search room</SelectItem>
                          <SelectItem value="roommate_seeker">Find roommate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><p className="text-sm text-muted-foreground">Occupation</p><Input value={profile.occupation || ""} onChange={(e) => updateProfile("occupation", e.target.value)} /></div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Preferred Contact Method</p>
                      <Select
                        value={profile.preferred_contact_method || "in_app"}
                        onValueChange={(v) => updateProfile("preferred_contact_method", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Preferred contact" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_app">In-app</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {profile.role === "renter" &&
                    (profile.occupation ?? "").trim().toLowerCase() === "student" && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">College</p>
                          <Input
                            value={studentProfile.college}
                            onChange={(e) =>
                              setStudentProfile((current) => ({
                                ...current,
                                college: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Year of Study</p>
                          <Input
                            value={studentProfile.year_of_study}
                            onChange={(e) =>
                              setStudentProfile((current) => ({
                                ...current,
                                year_of_study: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Branch</p>
                          <Input
                            value={studentProfile.branch}
                            onChange={(e) =>
                              setStudentProfile((current) => ({
                                ...current,
                                branch: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Preferred Areas ({selectedAreaIds.length} selected, minimum {MIN_PREFERRED_AREAS})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {areas.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => togglePreferredArea(area.id)}
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

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <Textarea className="min-h-[120px]" value={profile.bio || ""} onChange={(e) => updateProfile("bio", e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "rooms" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <AddProperty onPropertyAdded={handlePropertyAdded}>
                <Card className="cursor-pointer border-emerald-500/30 bg-emerald-500/10 shadow-sm transition hover:border-emerald-500/50">
                  <CardContent className="flex h-24 items-center justify-center gap-2 text-emerald-700">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add New Property</span>
                  </CardContent>
                </Card>
              </AddProperty>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Your Properties ({properties.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden border-border/60 shadow-sm">
                        <div className="h-40 bg-muted">
                          <img src={property.images?.[0] || "/placeholder.png"} alt={property.title} className="h-full w-full object-cover" />
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant={property.available ? "secondary" : "destructive"}>{property.available ? "Available" : "Booked"}</Badge>
                            <span className="text-sm font-semibold text-primary">Rs {property.rent}</span>
                          </div>
                          <h4 className="line-clamp-1 font-semibold">{property.title}</h4>
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{property.address}</p>
                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{property.views}</span>
                            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{property.inquiries}</span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-lg"
                              onClick={() => setEditingProperty(toEditDraft(property))}
                            >
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-lg"
                              onClick={() => handleToggleAvailability(property)}
                              disabled={actionPropertyId === property.id}
                            >
                              {property.available ? "Mark Booked" : "Mark Available"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" className="col-span-2 h-9 rounded-lg">
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Delete Property
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this property?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The listing will be removed from all users.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() => handleDeleteProperty(property.id)}
                                  >
                                    Confirm Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Top Performing Listings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topProperties.length === 0 && <p className="text-sm text-muted-foreground">No listings yet.</p>}
                  {topProperties.map((property, index) => (
                    <div key={property.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <div>
                        <p className="font-medium">#{index + 1} {property.title}</p>
                        <p className="text-xs text-muted-foreground">{property.area || "Dharamshala"}</p>
                      </div>
                      <div className="text-right flex gap-3 text-sm">
                        <p className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{property.views}</p>
                        <p className="inline-flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" />{property.inquiries}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Response Health</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Lead to View Ratio</p>
                    <p className="mt-1 text-2xl font-semibold">{totalViews > 0 ? Math.round((totalInquiries / totalViews) * 100) : 0}%</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Average Inquiry per Listing</p>
                    <p className="mt-1 text-2xl font-semibold">{properties.length ? (totalInquiries / properties.length).toFixed(1) : "0.0"}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-2xl font-semibold"><Clock3 className="h-4 w-4" />Today</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-medium">Profile visibility</p>
                    <p className="text-sm text-muted-foreground">Control what renters can see on public listing pages.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-medium">Notification preferences</p>
                    <p className="text-sm text-muted-foreground">Email and WhatsApp lead alerts (coming soon).</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="font-medium">Team access</p>
                    <p className="text-sm text-muted-foreground">Invite co-hosts or staff to manage listings (coming soon).</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </section>
      </main>

      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && setEditingProperty(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 grid-rows-[auto_minmax(0,1fr)_auto] sm:w-[calc(100vw-2rem)]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update listing details, status, and pricing.
            </DialogDescription>
          </DialogHeader>

          {editingProperty && (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 items-start overflow-y-auto">
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-muted-foreground">Title</p>
                <Input
                  value={editingProperty.title}
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, title: e.target.value } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <Input
                  value={editingProperty.address}
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, address: e.target.value } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Rent (Rs)</p>
                <Input
                  type="number"
                  min={2000}
                  max={50000}
                  value={editingProperty.rent}
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, rent: Number(e.target.value) || 0 } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Deposit (Rs)</p>
                <Input
                  type="number"
                  min={0}
                  max={45000}
                  value={editingProperty.deposit}
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, deposit: Number(e.target.value) || 0 } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Beds</p>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={editingProperty.bed_count}
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, bed_count: Number(e.target.value) || 1 } : current,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Area</p>
                <Select
                  value={editingProperty.area ?? "none"}
                  onValueChange={(value) =>
                    setEditingProperty((current) =>
                      current ? { ...current, area: value === "none" ? null : value } : current,
                    )
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    <SelectItem value="McLeod Ganj">McLeod Ganj</SelectItem>
                    <SelectItem value="Shyam Nagar">Shyam Nagar</SelectItem>
                    <SelectItem value="Ram Nagar">Ram Nagar</SelectItem>
                    <SelectItem value="Sakoh">Sakoh</SelectItem>
                    <SelectItem value="Education Board">Education Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Capacity</p>
                <Select
                  value={editingProperty.capacity ?? "none"}
                  onValueChange={(value) =>
                    setEditingProperty((current) =>
                      current ? { ...current, capacity: value === "none" ? null : value } : current,
                    )
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select capacity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Gender</p>
                <Select
                  value={editingProperty.gender ?? "none"}
                  onValueChange={(value) =>
                    setEditingProperty((current) =>
                      current ? { ...current, gender: value === "none" ? null : value } : current,
                    )
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select gender preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 p-3 self-start">
                <p className="text-sm font-medium">Availability</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available for inquiries</span>
                  <Switch
                    checked={editingProperty.available}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, available: checked } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 p-3 self-start">
                <p className="text-sm font-medium">Amenities</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Furnished</span>
                  <Switch
                    checked={editingProperty.furnished}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, furnished: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Near college</span>
                  <Switch
                    checked={editingProperty.near_college}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, near_college: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Electricity included</span>
                  <Switch
                    checked={editingProperty.electricity_included}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, electricity_included: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Water included</span>
                  <Switch
                    checked={editingProperty.water_included}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, water_included: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Wi-Fi included</span>
                  <Switch
                    checked={editingProperty.wifi_included}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, wifi_included: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attached bathroom</span>
                  <Switch
                    checked={editingProperty.attached_bathroom}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, attached_bathroom: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Parking available</span>
                  <Switch
                    checked={editingProperty.parking_available}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, parking_available: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Laundry available</span>
                  <Switch
                    checked={editingProperty.laundry_available}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, laundry_available: checked } : current,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kitchen available</span>
                  <Switch
                    checked={editingProperty.kitchen_available}
                    onCheckedChange={(checked) =>
                      setEditingProperty((current) =>
                        current ? { ...current, kitchen_available: checked } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-muted-foreground">Other facilities</p>
                <Input
                  value={editingProperty.other_facilities}
                  placeholder="Example: RO water, balcony, study table"
                  onChange={(e) =>
                    setEditingProperty((current) =>
                      current ? { ...current, other_facilities: e.target.value } : current,
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditingProperty(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePropertyEdit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
