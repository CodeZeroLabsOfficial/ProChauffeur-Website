# Website architecture

Customer-facing Elite Chauffeurs site: marketing pages plus a booking funnel that matches the mobile booking product outcomes.

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui primitives
- Same Firebase stamp as the operations portal and mobile apps (Auth, Firestore, callable Functions)
- Mapbox for address search and route display (public token only in the browser)

## Booking flow

1. **Fare estimate** — pickup, drop-off, vehicle class, add-ons, quote
2. **Trip details** — one-way / return, schedule, passengers, luggage
3. **Payment** — settlement method
4. **Summary** — confirm

Marketing hero may pre-fill estimate entry fields; it is not a separate booking product.

## Auth boundary

| Step | Auth |
|------|------|
| Browse marketing | None |
| Fare estimate / retail quote | Anonymous Auth (session) |
| Confirm + pay / saved cards / corporate | Email OTP create-account or sign-in |

Retail quotes use the existing `buildTripQuote` callable. Authenticated callers without a `users/{uid}` profile (anonymous web sessions) get **card/retail-only** pricing — no corporate settlement. Redeploy Functions after that handler change. No additional quote Cloud Function.

## Data

- **Vehicle classes** — `branches/{branchId}/vehicle_classes` (filter enabled, visible, capacity, trip type)
- **Add-ons** — from Location `settings/pricing` after authenticated (including anonymous) session
- **Trips / payments** — same callables and document shapes as other clients

Location (UI) = `branchId` in code. Do not call staff portal HTTP APIs from this app.

## Layout

See `.cursor/rules/structure-and-naming.mdc` for folders and naming. Marketing components live under `components/marketing/`; booking under `components/booking/`; primitives under `components/ui/`.

## Environment

Public client config only (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FUNCTIONS_REGION`, `NEXT_PUBLIC_MAPBOX_TOKEN`). Validate in `lib/env.ts`. Enable Anonymous Auth on the Firebase stamp and authorize this site’s domain for Auth and Mapbox.
