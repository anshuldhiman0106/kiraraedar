
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/seo"
import "./globals.css";
import { Toaster } from "sonner"

const siteUrl = getSiteUrl()
const siteName = "Kiraedar"
const defaultTitle = "Kiraedar | Student Rooms in Dharamshala"
const defaultDescription =
  "Find verified student rooms and PGs in Dharamshala. Compare rent, check amenities, and contact owners directly on Kiraedar."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Kiraedar",
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: [
    "PG in Dharamshala",
    "student rooms Dharamshala",
    "hostel Dharamshala",
    "rent room near college Dharamshala",
    "Kiraedar",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: defaultTitle,
    description: defaultDescription,
    siteName,
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Kiraedar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.maptiler.com" />
        <link rel="dns-prefetch" href="https://api.maptiler.com" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
      </head>
      <body>
        
        <ThemeProvider
         attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
