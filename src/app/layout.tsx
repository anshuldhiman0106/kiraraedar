
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import "./globals.css";
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: {
    default: "Home",
    template: "%s | Kiraedar",
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
