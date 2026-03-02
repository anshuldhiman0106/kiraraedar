# Operations Runbook

## Incidents

### OTP not delivered / mismatched
1. Check `/api/send-otp` and `/api/verify-otp` server logs.
2. Validate `TWO_FACTOR_API_KEY` and `OTP_SIGNING_SECRET`.
3. Confirm user uses fresh OTP (previous OTP invalid after resend).
4. Verify provider dashboard has no voice fallback if SMS-only is required.

### Payment verification failing
1. Check `RAZORPAY_KEY_SECRET` in environment.
2. Confirm signature payload format: `order_id|payment_id`.
3. Inspect `owner_plan_payments` row by `razorpay_order_id`.
4. Confirm profile update to `subscription_status=active` and `verified_landlord=true`.

### Image upload failing with RLS
1. Check storage policies and bucket names.
2. Ensure file path policy expectations match app path pattern.
3. Validate authenticated session exists at upload time.

## Daily Checks
- Build and lint status
- Error logs for API routes
- OTP success rates
- Payment success rates
- DB/storage growth
