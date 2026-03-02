const FALLBACK_PROD_URL = "https://kiraraedar.vercel.app"

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    FALLBACK_PROD_URL

  if (!configured) {
    return "http://localhost:3000"
  }

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured
  }

  return `https://${configured}`
}

