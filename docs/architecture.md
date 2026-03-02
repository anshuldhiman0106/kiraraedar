# Architecture

## High-Level
Kiraedar is a multi-role rental discovery app:
- Renter / Student
- Owner / Landlord
- Roommate seeker

Core data and auth are handled by Supabase. Frontend is Next.js App Router with client-driven interactivity.

## Core Modules
- `src/components/Home.tsx`: home search, filter, map sheet integration
- `src/features/home/components/listing-card.tsx`: listing card UI and actions
- `src/app/detail/[id]/page.tsx`: property detail page with inquiry/view updates
- `src/app/user_dashboard/page.tsx`: owner dashboard (analytics + manage properties)
- `src/components/AddProperty.tsx`: property create flow with map pin selection
- `src/app/profile/page.tsx`: onboarding/profile completion
- `src/app/profile/verifyphone/page.tsx`: OTP verify flow

## Backend Integration
- Supabase Auth: login/session/user state
- Supabase Postgres: `profiles`, `properties`, `owner_plan_payments`, etc.
- Supabase Realtime: property stats and owner listings live updates
- Supabase Storage: avatar and property image uploads

## Payments
- `/api/payments/create-order`: creates Razorpay order + tracks payment row
- `/api/payments/verify`: verifies signature and updates profile plan status

## OTP
- `/api/send-otp`: sends manual SMS OTP via 2Factor
- `/api/verify-otp`: verifies OTP against signed session token

## Map System
- Leaflet map canvas in a sheet panel
- Property markers + college reference pin
- Bounds-based query fetch from Supabase

## Design Direction
- SaaS dashboard style
- Mobile-first interactions for map/detail pages
- Clear owner action surfaces (edit/delete/status)
