# Security Notes

## Secrets
- Store secrets only in server environment variables.
- Never expose service role keys to client-side code.

## OTP
- Use short OTP TTL (currently 5 minutes).
- Invalidate OTP after successful verification.
- Add rate limits per phone/IP in production.

## Payments
- Always verify Razorpay signature server-side.
- Never trust client-reported payment success without signature check.

## Supabase RLS
- Enable RLS on sensitive tables.
- Restrict insert/update/delete to row owners.
- Audit storage object policies for bucket path ownership.

## Abuse Prevention
- Add request throttling on auth/OTP routes.
- Add bot protection if public abuse increases.
