'use client'
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Search,
  User,
  ChevronRight,
  MapPin,
  Star,
  SlidersHorizontal,
  House,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HomePage(props: { onLogout: () => void }) {
    const router = useRouter();
  return (
    <div className="min-h-screen bg-background  text-foreground">

      {/* Header + Search */}
      <div className="sticky top-0 z-20 flex items-center  justify-between bg-background px-6 pt-5 pb-4 border-b">
        <div className="flex items-center gap-2 ">
          <img src="/logo.svg" alt="Kiraraedar Logo" className="h-10 w-10" />
          <span className="text-2xl font-semibold tracking-wide">
            KIRAEDAR
          </span>
        </div>

        <button onClick={props.onLogout} className="h-11 rounded-lg border flex items-center gap-2 px-4 text-sm text-muted-foreground">
            Log Out
        </button>

       
      </div>

      {/* Heading */}
      <div className="px-6 mt-6">
        <h2 className="text-2xl font-semibold leading-tight">
          Find Your Perfect Room in Dharamshala
        </h2>
        <p className="text-base text-muted-foreground mt-1">
          For students and working professionals
        </p>
      </div>

      {/* Categories */}
      <div className="px-6  mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {["Room", "PG", "2-BHK", "Flat"].map((category, i) => (
            <Button
              key={category}
              variant={i === 0 ? "default" : "secondary"}
              className="min-w-[90px] h-fit  rounded-full py-4 flex-col gap-2"
            >
              <House />
              <span className="text-sm font-medium">{category}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Listing */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Featured Listing</h3>
            <p className="text-base text-muted-foreground">
              Verified & promoted
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <Card className="overflow-hidden rounded-2xl">
          <div className="relative h-52 bg-muted">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

            <Badge className="absolute top-4 left-4">
              Verified
            </Badge>

            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xl font-semibold">₹3,200 / month</p>
              <p className="text-base flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Barol, Dharamshala
              </p>

              <Button className="mt-3 w-full">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Rated */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Top Rated</h3>
            <p className="text-base text-muted-foreground">
              Highly reviewed rooms & PGs
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="min-w-[200px]">
              <div className="h-32 bg-muted rounded-t-lg" />
              <CardContent className="p-3">
                <p className="text-base font-semibold truncate">
                  Mountain View PG
                </p>

                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>₹6,500</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    4.7
                  </span>
                </div>

                <Badge variant="secondary" className="mt-2 text-[10px]">
                  Furnished
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Latest Listings */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Latest Listings</h3>
            <p className="text-base text-muted-foreground">
              Newly added
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-3 flex gap-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-1">
                    Modern 1BHK near Bus Stand
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    ₹40,000 · Available
                  </p>
                  <Badge
                    className="mt-2 text-[10px]"
                    variant="secondary"
                  >
                    Newly Listed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-6 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Button variant="ghost" className="flex-col h-auto gap-1">
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>

          <Button variant="ghost" className="flex-col h-auto gap-1">
            <Search className="h-5 w-5" />
            <span className="text-xs">Search</span>
          </Button>
          
          <Button  variant="ghost" className="flex-col h-auto gap-1">
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
