# Deployment Guide (Vercel + Supabase)

## 1. Supabase
1. Create project.
2. Apply schema + migrations:
```bash
supabase db push
```
3. Configure storage buckets/policies:
- `avatars`
- room images bucket used in app (`room-images`)

## 2. Vercel
1. Import repository.
2. Set all environment variables from `docs/environment-variables.md`.
3. Build command: `npm run build`
4. Output: Next.js default

## 3. Post-Deploy Validation
- Login and profile completion flow
- OTP send + verify
- Add property and image upload
- Home listing load and filters
- Detail page open + inquiry increment
- Owner plan purchase and verification

## 4. Rollback Strategy
- Keep previous stable deployment alias in Vercel.
- Roll back immediately on auth/payment regressions.
- For DB changes, use forward-fix migration (avoid destructive rollback in prod).
