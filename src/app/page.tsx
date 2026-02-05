"use client"

import { Button } from "@/components/ui/button"
import { IconHome, IconSearch } from "@tabler/icons-react"
import Link from 'next/link'
import Image from 'next/image'


export default function KiraraedarHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* subtle overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        
        {/* logo */}
        
        {/* heading */}
        <div className="mb-10 flex items-center gap-2 text-white">
          <img src="/logo.svg" alt="Kiraraedar Logo" className="h-14 aspect-square" />
          <span className="text-2xl font-semibold tracking-wide">
            KIRAEDAR
          </span>
        </div>
        {/* subtitle */}
        <p className="mb-8 max-w-sm text-sm text-white/80 sm:max-w-xl sm:text-base md:text-lg">
          Rooms for Dharamshala students • McLeod Ganj • Shyam Nagar • Govt College
        </p>

        {/* actions */}
        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
          <Button
            variant="default"
            size="lg"
            className="h-12 w-full rounded-full sm:w-auto"
            >
            <IconSearch className="mr-2 h-5 w-5" />
             Search Rooms
          </Button>
          </Link>
        
        <Link href="/login">
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-full sm:w-auto"
          >
            <IconHome className="mr-2 h-5 w-5" />
            List Property
          </Button>
        </Link>
        </div>

        {/* trust text */}
        <p className="mt-10 text-xs text-white/70 sm:text-sm">
          Trusted by Govt College Dharamshala students
        </p>
      </div>
    </section>
  )
}
