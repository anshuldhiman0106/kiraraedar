"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

type Props = React.PropsWithChildren;

const AddProperty = ({ children }: Props) => {
  const DEFAULT_MAP_CENTER: [number, number] = [32.219, 76.3234];
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  /* ================= PROPERTY STATE ================= */
  const [newProperty, setNewProperty] = useState({
    title: "",
    description: "",
    rent: 2000,
    deposit: 0,
    furnished: false,
    capacity: null as string | null,
    gender: null as string | null,
    available: true,
    address: "",
    area: null as string | null,
    lat: null as number | null,
    lng: null as number | null,
    near_college: false,
    images: [] as File[],
  });

  const LocationPicker = ({
    lat,
    lng,
    onPick,
  }: {
    lat: number | null;
    lng: number | null;
    onPick: (lat: number, lng: number) => void;
  }) => {
    const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEFAULT_MAP_CENTER;

    const MapResizer = () => {
      const map = useMap();

      useEffect(() => {
        const invalidate = () => map.invalidateSize();
        const t1 = window.setTimeout(invalidate, 30);
        const t2 = window.setTimeout(invalidate, 180);
        const t3 = window.setTimeout(invalidate, 420);
        window.addEventListener("resize", invalidate);

        return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
          window.clearTimeout(t3);
          window.removeEventListener("resize", invalidate);
        };
      }, [map]);

      return null;
    };

    const MapClickHandler = () => {
      useMapEvents({
        click(event) {
          onPick(event.latlng.lat, event.latlng.lng);
        },
      });
      return null;
    };

    return (
      <div className="overflow-hidden rounded-xl border border-border/60 h-[360px]">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full"
          style={{ height: "360px", width: "100%" }}
        >
          <MapResizer />
          <MapClickHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {lat !== null && lng !== null && (
            <CircleMarker
              center={[lat, lng]}
              radius={8}
              pathOptions={{
                color: "#065f46",
                fillColor: "#10b981",
                fillOpacity: 0.9,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      </div>
    );
  };

  /* ================= LOAD AUTH USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    loadUser();
  }, []);

  /* ================= IMAGE UPLOAD ================= */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!userId) return [];

    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `properties/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${ext}`;

      const { error } = await supabase.storage
        .from("room-images")
        .upload(fileName, file);

      if (error) {
        console.error(error);
        continue;
      }

      const { data } = supabase.storage
        .from("room-images")
        .getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  /* ================= ADD PROPERTY ================= */
  const addProperty = async () => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    /* -------- VALIDATION (MATCHES DB CONSTRAINTS) -------- */

    if (!newProperty.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!newProperty.address.trim()) {
      toast.error("Address is required");
      return;
    }

    if (newProperty.lat === null || newProperty.lng === null || !locationConfirmed) {
      toast.error("Select location on map and click 'Use this location'");
      return;
    }

    if(!newProperty.images || newProperty.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (!newProperty.area) {
      toast.error("Please select an area");
      return;
    }

    if (!newProperty.capacity) {
      toast.error("Please select room type");
      return;
    }

    if (!newProperty.gender) {
      toast.error("Please select gender preference");
      return;
    }

    if (newProperty.rent < 2000 || newProperty.rent > 15000) {
      toast.error("Rent must be between ₹2000 and ₹15000");
      return;
    }

    if (newProperty.deposit < 0 || newProperty.deposit > 45000) {
      toast.error("Deposit must be between ₹0 and ₹45000");
      return;
    }

    setUploading(true);

    try {
      let imageUrls: string[] = [];

      if (newProperty.images.length > 0) {
        const toastId = toast.loading("Uploading images...");
        imageUrls = await uploadImages(newProperty.images);
        toast.success("Images uploaded!", { id: toastId });
      }

      const propertyData = {
        owner_id: userId,
        title: newProperty.title.trim(),
        description: newProperty.description.trim() || null,
        rent: newProperty.rent,
        deposit: newProperty.deposit ?? null,
        furnished: newProperty.furnished,
        capacity: newProperty.capacity,
        gender: newProperty.gender,
        available: newProperty.available,
        address: newProperty.address.trim(),
        area: newProperty.area,
        lat: newProperty.lat,
        lng: newProperty.lng,
        near_college: newProperty.near_college,
        images: imageUrls.length > 0 ? imageUrls : null,
        views: 0,
        inquiries: 0,
      };

      const { error } = await supabase
        .from("properties")
        .insert([propertyData]);

      if (error) throw error;

      toast.success("Property published successfully!");

      setNewProperty({
        title: "",
        description: "",
        rent: 2000,
        deposit: 0,
        furnished: false,
        capacity: null,
        gender: null,
        available: true,
        address: "",
        area: null,
        lat: null,
        lng: null,
        near_college: false,
        images: [],
      });
      setLocationConfirmed(false);
      setFormStep(1);
      setDialogOpen(false);

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish property");
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setFormStep(1);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>
            {formStep === 1 ? "Add New Property" : "Select Property Location"}
          </DialogTitle>
          <DialogDescription>
            {formStep === 1
              ? "Step 1 of 2: Fill property details."
              : "Step 2 of 2: Pick location on map and confirm it."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
          {formStep === 1 && (
            <>

          {/* BASIC INFO */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3 space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newProperty.title}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, title: e.target.value })
                  }
                />
              </div>

              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-between">
                  <Label>Rent</Label>
                  <span>₹{newProperty.rent}</span>
                </div>
                <Slider
                  min={2000}
                  max={15000}
                  step={500}
                  value={[newProperty.rent]}
                  onValueChange={(v) =>
                    setNewProperty({ ...newProperty, rent: v[0] })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Deposit</Label>
                  <span>₹{newProperty.deposit}</span>
                </div>
                <Slider
                  min={0}
                  max={45000}
                  step={1000}
                  value={[newProperty.deposit]}
                  onValueChange={(v) =>
                    setNewProperty({ ...newProperty, deposit: v[0] })
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* LOCATION */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Location</h3>

            <Select
              value={newProperty.area ?? undefined}
              onValueChange={(v) =>
                setNewProperty({ ...newProperty, area: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="McLeod Ganj">McLeod Ganj</SelectItem>
                <SelectItem value="Shyam Nagar">Shyam Nagar</SelectItem>
                <SelectItem value="Ram Nagar">Ram Nagar</SelectItem>
                <SelectItem value="Sakoh">Sakoh</SelectItem>
                <SelectItem value="Education Board">
                  Education Board
                </SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Full Address"
              value={newProperty.address}
              onChange={(e) =>
                setNewProperty({ ...newProperty, address: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Exact pin location is selected in the next step.
            </p>
          </section>

          <Separator />

          {/* ROOM DETAILS */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Room Details</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Room Type *</Label>
                <Select
                  value={newProperty.capacity ?? undefined}
                  onValueChange={(v) =>
                    setNewProperty({ ...newProperty, capacity: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gender Preference *</Label>
                <Select
                  value={newProperty.gender ?? undefined}
                  onValueChange={(v) =>
                    setNewProperty({ ...newProperty, gender: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* AMENITIES */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Amenities</h3>

            <div className="flex justify-between border p-4 rounded-xl">
              <Label>Furnished</Label>
              <Switch
                checked={newProperty.furnished}
                onCheckedChange={(v) =>
                  setNewProperty({ ...newProperty, furnished: v })
                }
              />
            </div>

            <div className="flex justify-between border p-4 rounded-xl">
              <Label>Near College</Label>
              <Switch
                checked={newProperty.near_college}
                onCheckedChange={(v) =>
                  setNewProperty({ ...newProperty, near_college: v })
                }
              />
            </div>

            <div className="flex justify-between border p-4 rounded-xl">
              <Label>Available</Label>
              <Switch
                checked={newProperty.available}
                onCheckedChange={(v) =>
                  setNewProperty({ ...newProperty, available: v })
                }
              />
            </div>
          </section>

          <Separator />

          {/* IMAGES */}
          <section>
            <Label>Photos (Max 8)</Label>
            <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl h-32">
              <ImagePlus className="h-10 w-10 text-muted-foreground" />
              <input
                type="file"
                multiple
                className="hidden"
                id="images"
                onChange={(e) => {
                  const files = Array.from(
                    (e.target as HTMLInputElement).files || []
                  );
                  setNewProperty({
                    ...newProperty,
                    images: files.slice(0, 8),
                  });
                }}
              />
              <label htmlFor="images" className="cursor-pointer">
                {newProperty.images.length}/8 selected
              </label>
            </div>
          </section>
            </>
          )}

          {formStep === 2 && (
            <section className="space-y-4">
              <Label>Tap on map to choose exact location</Label>
              <LocationPicker
                lat={newProperty.lat}
                lng={newProperty.lng}
                onPick={(lat, lng) => {
                  setNewProperty({
                    ...newProperty,
                    lat: Number(lat.toFixed(7)),
                    lng: Number(lng.toFixed(7)),
                  });
                  setLocationConfirmed(false);
                }}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newProperty.lat === null || newProperty.lng === null) {
                      toast.error("Tap on map to select location first");
                      return;
                    }
                    setLocationConfirmed(true);
                    toast.success("Location selected");
                  }}
                >
                  Use this location
                </Button>
                <p className="text-xs text-muted-foreground">
                  {locationConfirmed
                    ? "Location confirmed. You can publish now."
                    : "After selecting pin, click Use this location."}
                </p>
              </div>
            </section>
          )}

        </div>

        <div className="p-6 border-t">
          {formStep === 1 ? (
            <Button
              type="button"
              onClick={() => {
                if (!newProperty.title.trim()) {
                  toast.error("Title is required");
                  return;
                }
                if (!newProperty.area) {
                  toast.error("Please select an area");
                  return;
                }
                if (!newProperty.address.trim()) {
                  toast.error("Address is required");
                  return;
                }
                if (!newProperty.capacity) {
                  toast.error("Please select room type");
                  return;
                }
                if (!newProperty.gender) {
                  toast.error("Please select gender preference");
                  return;
                }
                setFormStep(2);
              }}
              className="w-full h-14 rounded-xl"
            >
              Continue to Location
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormStep(1)}
                className="h-14 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={addProperty}
                disabled={uploading || !locationConfirmed}
                className="flex-1 h-14 rounded-xl"
              >
                {uploading ? "Publishing..." : "Publish Property"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProperty;
