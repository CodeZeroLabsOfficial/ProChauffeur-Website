# Website architecture

Customer-facing Elite Chauffeurs site: marketing pages plus a booking funnel that matches the mobile booking product outcomes.

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui primitives
- Same Firebase stamp as the operations portal and mobile apps (Auth, Firestore, callable Functions)
- Mapbox for address search and maps (public token only in the browser)
- Stripe.js Payment Element for card confirm (publishable key only in the browser)

## Booking flow

1. **Fare estimate** (`/book`) — pickup, drop-off, vehicle class, add-ons, quote
2. **Trip details** (`/book/details`) — one-way / return, schedule, passengers, luggage
3. **Payment** (`/book/payment`) — Email OTP if guest, then card settlement selection
4. **Summary** (`/book/summary`) — review, `createTripCardPayment`, Stripe confirm
5. **Confirmed** (`/book/confirmed`) — success

Marketing hero may pre-fill estimate entry fields; it is not a separate booking product.

## Auth boundary

| Step | Auth |
|------|------|
| Browse marketing | None |
| Fare estimate / retail quote | Anonymous Auth (session) |
| Payment / confirm / pay | Email OTP create-account or sign-in (`requestAuthOtp` / `verifyAuthOtp`) |

Retail quotes use `buildTripQuote`. Authenticated callers without a `users/{uid}` profile (anonymous web sessions) get **card/retail-only** pricing. Redeploy Functions after that handler change.

Confirm uses `createTripCardPayment` (requires customer role). OTP verify provisions `users/{uid}` with `role: customer` when needed.

## Data

- **Vehicle classes** — `branches/{branchId}/vehicle_classes` (filter enabled, visible, capacity, trip type)
- **Add-ons** — Location `settings/pricing` after authenticated (including anonymous) session
- **Trips / payments** — same callables and document shapes as other clients (`journey.dropoff`, `scheduledPickupAt`, `vehicleClassId`, `addonIds` / `bookingAddons`, `capacity`)

Location (UI) = `branchId` in code. Do not call staff portal HTTP APIs from this app.

## Hardening

- Fail fast on missing Firebase / Mapbox env; Stripe publishable key optional until checkout
- No service-account or Stripe secret keys in the client bundle
- Do not log addresses, phones, or payment refs
- Client totals are display-only; server recomputes fare on `createTripCardPayment`
- Wizard steps guard incomplete state and send guests back to earlier routes

## Layout

See `.cursor/rules/structure-and-naming.mdc` for folders and naming. Marketing under `components/marketing/`; booking under `components/booking/`; primitives under `components/ui/`.

## Environment

`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FUNCTIONS_REGION`, `NEXT_PUBLIC_MAPBOX_TOKEN`, optional `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Validate in `lib/env.ts`. Enable Anonymous Auth and authorize this site’s domain for Auth, Mapbox, and Stripe.
