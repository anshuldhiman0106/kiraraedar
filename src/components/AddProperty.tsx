"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewSwipeStartXRef = useRef<number | null>(null);

  /* ================= PROPERTY STATE ================= */
  const [newProperty, setNewProperty] = useState({
    title: "",
    description: "",
    rent: 2000,
    deposit: 0,
    furnished: false,
    bed_count: 1,
    electricity_included: false,
    water_included: false,
    wifi_included: false,
    attached_bathroom: false,
    parking_available: false,
    laundry_available: false,
    kitchen_available: false,
    other_facilities: "",
    capacity: null as string | null,
    gender: null as string | null,
    available: true,
    address: "",
    area: null as string | null,
    lat: null as number | null,
    lng: null as number | null,
    near_college: false,
    is_property_owner: true,
    actual_owner_name: "",
    actual_owner_phone: "",
    images: [] as File[],
  });

  const SelectArea=[
    "McLeod Ganj",
    "Shyam Nagar",
    "Ram Nagar",
    "Sakoh",
    "Education Board",
    "Naddi",
    "Bhagsu",
    "Kotwali Bazar",
    "Kacheri",
    "Dari",
    "Near Station",
    "Chelian",
    "Darnu",
  ]

  const setPickedLocation = (lat: number, lng: number) => {
    setNewProperty((prev) => ({
      ...prev,
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
    }));
    setLocationConfirmed(false);
  };

  const isWithinIndia = (lat: number, lng: number) => {
    // Rough India bounding box.
    return lat >= 6 && lat <= 38.8 && lng >= 68 && lng <= 97.5;
  };

  const useCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Location not supported on this device/browser");
      return;
    }

    setLocatingCurrent(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!isWithinIndia(lat, lng)) {
          setLocatingCurrent(false);
          toast.error("Current location looks outside India. Please select location on the map.");
          return;
        }

        setNewProperty((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(7)),
          lng: Number(lng.toFixed(7)),
        }));
        setLocationConfirmed(true);
        setLocatingCurrent(false);
        toast.success("Current location selected");
      },
      (error) => {
        setLocatingCurrent(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access.");
          return;
        }

        if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out. Try again.");
          return;
        }

        toast.error("Unable to fetch current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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

    const MapCenterUpdater = ({ target }: { target: [number, number] | null }) => {
      const map = useMap();

      useEffect(() => {
        if (target) {
          map.setView(target, map.getZoom(), { animate: true });
        }
      }, [target, map]);

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
          <MapCenterUpdater target={lat !== null && lng !== null ? [lat, lng] : null} />
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

  useEffect(() => {
    const urls = newProperty.images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newProperty.images]);

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

  const nextPreviewSlide = () => {
    if (!previewUrls.length) return;
    setPreviewIndex((prev) => (prev + 1) % previewUrls.length);
  };

  const prevPreviewSlide = () => {
    if (!previewUrls.length) return;
    setPreviewIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
  };

  const handlePreviewTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    previewSwipeStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handlePreviewTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (previewSwipeStartXRef.current === null) {
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? previewSwipeStartXRef.current;
    const deltaX = endX - previewSwipeStartXRef.current;
    const threshold = 45;

    if (deltaX <= -threshold) {
      nextPreviewSlide();
    } else if (deltaX >= threshold) {
      prevPreviewSlide();
    }

    previewSwipeStartXRef.current = null;
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

    if (!newProperty.is_property_owner) {
      if (!newProperty.actual_owner_name.trim()) {
        toast.error("Please enter actual owner name");
        return;
      }
      if (!newProperty.actual_owner_phone.trim()) {
        toast.error("Please enter actual owner phone number");
        return;
      }
    }

    if (newProperty.rent < 2000 || newProperty.rent > 50000) {
      toast.error("Rent must be between ₹2000 and ₹50000");
      return;
    }

    if (newProperty.deposit < 0 || newProperty.deposit > 45000) {
      toast.error("Deposit must be between ₹0 and ₹45000");
      return;
    }

    if (newProperty.bed_count < 1 || newProperty.bed_count > 12) {
      toast.error("Bed count must be between 1 and 12");
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
        bed_count: newProperty.bed_count,
        electricity_included: newProperty.electricity_included,
        water_included: newProperty.water_included,
        wifi_included: newProperty.wifi_included,
        attached_bathroom: newProperty.attached_bathroom,
        parking_available: newProperty.parking_available,
        laundry_available: newProperty.laundry_available,
        kitchen_available: newProperty.kitchen_available,
        other_facilities: newProperty.other_facilities.trim() || null,
        capacity: newProperty.capacity,
        gender: newProperty.gender,
        available: newProperty.available,
        address: newProperty.address.trim(),
        area: newProperty.area,
        lat: newProperty.lat,
        lng: newProperty.lng,
        near_college: newProperty.near_college,
        is_property_owner: newProperty.is_property_owner,
        actual_owner_name: newProperty.is_property_owner
          ? null
          : newProperty.actual_owner_name.trim(),
        actual_owner_phone: newProperty.is_property_owner
          ? null
          : newProperty.actual_owner_phone.trim(),
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
        bed_count: 1,
        electricity_included: false,
        water_included: false,
        wifi_included: false,
        attached_bathroom: false,
        parking_available: false,
        laundry_available: false,
        kitchen_available: false,
        other_facilities: "",
        capacity: null,
        gender: null,
        available: true,
        address: "",
        area: null,
        lat: null,
        lng: null,
        near_college: false,
        is_property_owner: true,
        actual_owner_name: "",
        actual_owner_phone: "",
        images: [],
      });
      setLocationConfirmed(false);
      setFormStep(1);
      setPreviewIndex(0);
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
                  max={50000}
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
                {SelectArea.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
                
                
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

              <div className="space-y-2">
                <Label>Number of Beds *</Label>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Selected beds</span>
                    <span>{newProperty.bed_count}</span>
                  </div>
                  <Slider
                    min={1}
                    max={12}
                    step={1}
                    value={[newProperty.bed_count]}
                    onValueChange={(v) =>
                      setNewProperty({
                        ...newProperty,
                        bed_count: v[0] ?? 1,
                      })
                    }
                  />
                </div>
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
              <Label>I am the property owner</Label>
              <Switch
                checked={newProperty.is_property_owner}
                onCheckedChange={(v) =>
                  setNewProperty({
                    ...newProperty,
                    is_property_owner: v,
                    actual_owner_name: v ? "" : newProperty.actual_owner_name,
                    actual_owner_phone: v ? "" : newProperty.actual_owner_phone,
                  })
                }
              />
            </div>

            {!newProperty.is_property_owner && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Actual owner name *</Label>
                  <Input
                    placeholder="Enter owner name"
                    value={newProperty.actual_owner_name}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        actual_owner_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual owner phone *</Label>
                  <Input
                    placeholder="Enter owner phone"
                    value={newProperty.actual_owner_phone}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        actual_owner_phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Electricity bill included</Label>
                <Switch
                  checked={newProperty.electricity_included}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, electricity_included: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Water bill included</Label>
                <Switch
                  checked={newProperty.water_included}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, water_included: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Wi-Fi included</Label>
                <Switch
                  checked={newProperty.wifi_included}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, wifi_included: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Attached bathroom</Label>
                <Switch
                  checked={newProperty.attached_bathroom}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, attached_bathroom: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Parking available</Label>
                <Switch
                  checked={newProperty.parking_available}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, parking_available: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl">
                <Label>Laundry available</Label>
                <Switch
                  checked={newProperty.laundry_available}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, laundry_available: v })
                  }
                />
              </div>
              <div className="flex justify-between border p-4 rounded-xl md:col-span-2">
                <Label>Kitchen available</Label>
                <Switch
                  checked={newProperty.kitchen_available}
                  onCheckedChange={(v) =>
                    setNewProperty({ ...newProperty, kitchen_available: v })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Other facilities</Label>
              <Input
                placeholder="Example: RO water, study table, balcony"
                value={newProperty.other_facilities}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, other_facilities: e.target.value })
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
            <Label className="mb-3">Photos (Max 8)</Label>
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
                  setPreviewIndex(0);
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
            {previewUrls.length > 0 && (
              <div
                className="relative mt-4 overflow-hidden rounded-xl border border-border/60"
                onTouchStart={handlePreviewTouchStart}
                onTouchEnd={handlePreviewTouchEnd}
              >
                <img
                  src={previewUrls[previewIndex]}
                  alt={`Preview ${previewIndex + 1}`}
                  className="h-56 w-full object-cover"
                />
                {previewUrls.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/70"
                      onClick={prevPreviewSlide}
                    >
                      ‹
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/70"
                      onClick={nextPreviewSlide}
                    >
                      ›
                    </Button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/45 px-2 py-1">
                      {previewUrls.map((_, index) => (
                        <button
                          key={`preview-dot-${index}`}
                          type="button"
                          className={`h-2 w-2 rounded-full ${index === previewIndex ? "bg-white" : "bg-white/60"}`}
                          onClick={() => setPreviewIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
            </>
          )}

          {formStep === 2 && (
            <section className="space-y-4">
              <Label>Tap on map to choose exact location</Label>
              <LocationPicker
                lat={newProperty.lat}
                lng={newProperty.lng}
                onPick={setPickedLocation}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={useCurrentLocation}
                  disabled={locatingCurrent}
                >
                  {locatingCurrent ? "Fetching current location..." : "Use current location"}
                </Button>
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
