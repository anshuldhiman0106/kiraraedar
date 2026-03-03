"use client"

import Link from "next/link"
import { IconBrandInstagram, IconMail, IconPhone } from "@tabler/icons-react"

const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/60">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Kiraedar logo" className="h-7 w-7" />
            <p className="text-lg font-semibold">Kiraedar</p>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Verified student rooms in Dharamshala. Compare listings and contact owners directly.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Links</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/detail" className="hover:underline">
              Explore Listings
            </Link>
            <Link href="/login" className="hover:underline">
              Login
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
          <div className="space-y-2 space-x-3 text-sm">
            <a href="mailto:kiraedarr@gmail.com" className="inline-flex items-center gap-2 hover:underline">
              <IconMail className="h-4 w-4" />
              kiraedarr@gmail.com
            </a>
            <a href="tel:+917876151487" className="inline-flex items-center gap-2 hover:underline">
              <IconPhone className="h-4 w-4" />
              +91 78761 51487
            </a>
            <a
              href="https://instagram.com/_kiraedar_"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <IconBrandInstagram className="h-4 w-4" />
              @_kiraedar_
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {currentYear} Kiraedar. All rights reserved.
      </div>
    </footer>
  )
}

