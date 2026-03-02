# Kiraedar

SaaS-style student housing platform for Dharamshala.

## What This Project Includes
- Property search with filters and map-based discovery
- Favorites (local storage)
- Property detail pages with live view/inquiry counters
- Owner dashboard with listing management
- Plan activation with Razorpay (verified landlord flow)
- Phone verification with OTP (2Factor SMS integration)

## Tech Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Realtime, Storage)
- Razorpay (owner plan payments)
- Leaflet + MapTiler (map search)

## Quick Start
1. Install dependencies:
```bash
npm install
```
2. Create `.env.local` from `.env.example`.
3. Run DB migrations (Supabase CLI):
```bash
supabase db push
```
4. Start dev server:
```bash
npm run dev
```

## Quality Checks
```bash
npm run lint
npm run build
```

## Documentation
- [Docs Index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Environment Variables](docs/environment-variables.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Operations Runbook](docs/operations-runbook.md)
- [Launch Checklist](docs/launch-checklist.md)
- [Security Notes](docs/security.md)

## Current Readiness
- Build: passing
- Lint: passing with non-blocking image optimization warnings
- Core flows: implemented (search, listing, owner ops, OTP, payments)

## License
Private project.
