# Website architecture

Customer-facing Elite Chauffeurs site: marketing pages plus a booking funnel that matches the mobile booking product outcomes.

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui primitives
- Same Firebase stamp as the operations portal and mobile apps (Auth, Firestore, callable Functions)
- Mapbox for address search and maps (public token only in the browser)
- Stripe.js Payment Element for card confirm (publishable key only in the browser)

## Booking flow

1. **Fare estimate** (`/booking`) — pickup, drop-off, vehicle class, add-ons, quote
2. **Trip details** (`/booking/details`) — one-way / return, schedule, passengers, luggage
3. **Payment** (`/booking/payment`) — Email OTP if guest, then card settlement selection
4. **Summary** (`/booking/summary`) — review, `createTripCardPayment`, Stripe confirm
5. **Confirmed** (`/booking/confirmed`) — success

Legacy `/book` URLs redirect to `/booking`. Marketing hero may pre-fill estimate entry fields; it is not a separate booking product.

Site chrome uses one shared `SiteHeader` (black, logo left) on marketing and booking. The estimate step adds a black trip field strip under the header.

## Auth boundary

| Step | Auth |
|------|------|
| Browse marketing | None |
| Fare estimate / retail quote | Anonymous Auth (session) |
| Payment / confirm / pay | Email OTP create-account or sign-in (`requestAuthOtp` / `verifyAuthOtp`) |

Catalog and Mapbox country/proximity load via callable `getBookingCatalog` (Anonymous allowed). The website does **not** read Firestore catalog collections from the client.

Retail quotes use `buildTripQuote`. Authenticated callers without a `users/{uid}` profile (anonymous web sessions) get **card/retail-only** pricing. Redeploy Functions after that handler change.

Confirm uses `createTripCardPayment` (requires customer role). OTP verify provisions `users/{uid}` with `role: customer` when needed.

## Data

- **Catalog** — `getBookingCatalog` returns sanitized branches, mapbox context, eligible vehicle classes, and add-ons (Admin SDK; filters enabled/visible/capacity/trip type)
- **Quotes** — `buildTripQuote` (server fare math)
- **Trips / payments** — same callables and document shapes as other clients (`journey.dropoff`, `scheduledPickupAt`, `vehicleClassId`, `addonIds` / `bookingAddons`, `capacity`)

Location (UI) = `branchId` in code. Do not call staff portal HTTP APIs from this app.

## Hardening

- Fail fast on missing Firebase / Mapbox env; Stripe publishable key optional until checkout
- No service-account or Stripe secret keys in the client bundle
- Do not log addresses, phones, or payment refs
- Client totals are display-only; server recomputes fare on `createTripCardPayment`
- Wizard steps guard incomplete state and send guests back to earlier routes
- No public Firestore rules for anonymous catalog reads

## Layout

See `.cursor/rules/structure-and-naming.mdc` for folders and naming. Marketing under `components/marketing/`; booking under `components/booking/`; primitives under `components/ui/`.

## Environment

`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FUNCTIONS_REGION`, `NEXT_PUBLIC_MAPBOX_TOKEN`, optional `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Validate in `lib/env.ts`. Enable Anonymous Auth and authorize this site’s domain for Auth, Mapbox, and Stripe. Deploy `getBookingCatalog` and updated `buildTripQuote`.
