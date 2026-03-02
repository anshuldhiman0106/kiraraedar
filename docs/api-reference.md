# API Reference

## POST `/api/send-otp`
Sends SMS OTP to Indian mobile number.

Request:
```json
{ "phone": "+919876543210" }
```

Success:
```json
{ "success": true, "status": "pending", "sessionId": "..." }
```

## POST `/api/verify-otp`
Verifies OTP using signed session token.

Request:
```json
{ "phone": "+919876543210", "code": "123456", "sessionId": "..." }
```

Success:
```json
{ "success": true }
```

## POST `/api/payments/create-order`
Creates Razorpay order for owner plan.

Headers:
- `Authorization: Bearer <supabase_access_token>`

Success:
```json
{
  "key": "rzp_...",
  "orderId": "order_...",
  "amount": 10000,
  "currency": "INR",
  "planName": "Landlord Pro Plan"
}
```

## POST `/api/payments/verify`
Verifies Razorpay signature and activates landlord plan.

Headers:
- `Authorization: Bearer <supabase_access_token>`

Request:
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

Success:
```json
{ "success": true, "subscription_status": "active", "verified_landlord": true }
```
