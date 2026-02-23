"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { 
  Search, Filter, MapPin, Star, Heart, Bed, Users, Calendar, ArrowRight,
  Building, Home, MessageCircle, User, Globe, ImagePlus,ChevronLeft, ChevronRight,
  Sun,
  Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthSession } from "@/hooks/use-auth-session"
import { useTheme } from "next-themes"


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
  created_at?: string
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const router = useRouter()
  const { session, user, loading: authLoading } = useAuthSession()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    fetchProperties()
  }, [])

  // ADD Carousel Component
const PropertyCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-xl flex items-center justify-center">
        <Building className="h-16 w-16 text-slate-400" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-t-xl group">
      {/* Main Image */}
      <img
        src={images[currentIndex]}
        alt="Property"
        className="w-full h-64 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 group-hover:brightness-100"
        loading="lazy"
      />
      
      {/* Carousel Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full py-2 px-3">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-white shadow-lg" : "bg-white/50 hover:bg-white/70"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronLeft className="h-5 w-5 text-slate-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronRight className="h-5 w-5 text-slate-800" />
          </button>
        </>
      )}

      {/* Image Count */}
      {images.length > 1 && (
        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}

  const fetchProperties = async () => {
    try {
      setLoading(true)
      // Fetch LIVE properties from your new table
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          views,
          inquiries
        `)
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(12)

      if (error) {
        toast.error("Failed to fetch properties")
        console.error(error)
      } else {
        setProperties(data || [])
      }
    } catch (error) {
      toast.error("Failed to load properties")
    } finally {
      setLoading(false)
    }
  }

  const Profilebtn = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Heart className="h-4 w-4 mr-2" />
          Favorites
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/user_dashboard")}>
          <UserIcon className="h-4 w-4 mr-2" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark mode
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={async () => {
            const { error } = await supabase.auth.signOut()
            if (error) {
              toast.error("Error logging out: " + error.message)
            }
          }} 
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const SearchBar = () => (
    <div className="sm:w-full max-w-5xl mx-auto">
      <div className="flex items-center rounded-full border border-border shadow-md px-2 py-2">
        <div className="flex-1 px-6 gap-2 cursor-text">
          <div className="text-xs font-medium text-foreground">Where</div>
          <Input
            placeholder="Search McLeod Ganj, Shyam Nagar, Ram Nagar..."
            className="h-auto border-none text-lg font-semibold focus-visible:ring-0 dark:bg-input-transparent p-0"
          />
        </div>
        <Button
          size="icon"
          className="ml-2 h-15 w-15 rounded-full text-white shadow-md bg-gradient-to-r from-primary to-primary/90"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )

const ListingCard = ({ property, index }: { property: Property, index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      
        <Card className="overflow-hidden hover:shadow-2xl hover:shadow-neutral-800/50 hover:-translate-y-2 transition-all duration-500 border-0 bg-card shadow-lg hover:shadow-2xl border-border/50 cursor-pointer">
          
          {/* CAROUSEL - Multiple Images! */}
          <PropertyCarousel images={property.images || []} />
          
          {/* Heart Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 z-20 h-11 w-11 rounded-full bg-card/95 hover:bg-card backdrop-blur-sm shadow-lg border-border/50"
          >
            <Heart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>

          

          <CardContent className="p-6 pt-0 pb-6">
            {/* Badges */}
          <div className=" top-3 mb-3  z-20 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-muted/90 backdrop-blur-sm">
              {property.capacity?.toUpperCase()} • {property.gender?.toUpperCase()}
            </Badge>
            {property.furnished && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Furnished
              </Badge>
            )}
            {property.near_college && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                Near College
              </Badge>
            )}
          </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.area || "Dharamshala"} · {property.address.split(',')[0]}</span>
              </div>

              <CardTitle className="text-xl font-bold leading-tight line-clamp-2 hover:text-primary transition-colors">
                {property.title}
              </CardTitle>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  <span>{property.capacity === "single" ? "1 bed" : 
                        property.capacity === "duo" ? "2 beds" : "3 beds"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{property.capacity === "single" ? "1 guest" : 
                        property.capacity === "duo" ? "2 guests" : "3 guests"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-border/50 border-t">
                <div>
                  <div className="text-2xl font-black text-foreground">₹{property.rent}</div>
                  <div className="text-sm text-muted-foreground">
                    month {property.deposit ? `+ ₹${property.deposit} deposit` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <div>{property.views} views</div>
                  <div>{property.inquiries} inquiries</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
   
    </motion.div>
  )
}
  return (
    <div className="min-h-screen ">
      {/* HEADER */}
      <header className="sticky bg-card/95 top-0 z-50 backdrop-blur-xl shadow-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg">
                <img src="logo.svg" alt="Kiraedar Logo" className="w-10 h-10" />
              </div>
              <div className="px-1 hidden lg:block">
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text">
                  Kiraedar
                </h1>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:block">
              <SearchBar />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-accent">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Profilebtn />
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-none border-t border-border shadow-lg"
            >
              <SearchBar />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 lg:mb-32">
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent mb-6 leading-tight drop-shadow-2xl">
            Find your perfect room
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 lg:mb-16 leading-relaxed">
            Discover {properties.length} verified rooms in Dharamshala at unbeatable prices
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 lg:mb-20 space-y-4 lg:space-y-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">
                {properties.length} rooms
              </h2>
              <Separator orientation="vertical" className="hidden sm:block h-6 bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Sort by:</span>
                <Select defaultValue="newest">
                  <SelectTrigger className="h-10 rounded-xl border-border/50 bg-card px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card">
                Map
              </Button>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1 lg:flex-none h-11 px-4 lg:px-6 rounded-xl border-border/50 bg-card">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl bg-card border-border/50">
                  {/* Filters content here */}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-[420px] rounded-2xl bg-muted" />
            ))
          ) : (
            properties.map((property, index) => (
              <ListingCard key={property.id} property={property} index={index} />
            ))
          )}
        </div>

        {/* Load More */}
        <div className="text-center py-20">
          <Button size="lg" className="h-16 px-16 rounded-2xl text-xl shadow-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600">
            Show more rooms
          </Button>
        </div>
      </div>

      {/* Mobile Search Trigger */}
      <div 
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        onClick={() => setSearchOpen(!searchOpen)}
      >
        <Button className="h-16 w-16 rounded-3xl shadow-2xl p-0 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600">
          <Search className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
