
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";
import { Toaster } from "sonner"


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
