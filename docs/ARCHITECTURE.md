# Website architecture

Customer-facing Elite Chauffeurs site: marketing pages, booking funnel matching mobile booking product outcomes, and a signed-in customer dashboard.

## Stack

- Next.js App Router, React, TypeScript, Tailwind, shadcn/ui primitives
- Same Firebase stamp as the operations portal and mobile apps (Auth, Firestore, callable Functions)
- Mapbox for address search and maps (public token only in the browser)
- Stripe.js Payment Element for card confirm and saved-card SetupIntents (publishable key only in the browser)

## Booking flow

1. **Fare estimate** (`/booking`) — pickup, drop-off, schedule, passengers, vehicle class, luggage, add-ons, quote. Hero and header trip strip seed/edit journey fields (including one-way / return and passengers).
2. **Email login / sign-up** (`/login?redirect=/booking/summary`) — when the session is not an email customer
3. **Summary** (`/booking/summary`) — payment (saved card or new card) + map/fare aside, single Book now → `paymentsCreateCardPayment` + Stripe confirm
4. **Confirmed** (`/booking/confirmed`) — success

Legacy `/book` URLs redirect to `/booking`. Marketing hero may pre-fill estimate entry fields; it is not a separate booking product. Journey fields persist in `sessionStorage` across the login round-trip.

Site chrome uses one shared `SiteHeader` (black, logo left) on marketing and booking. Sign in goes to `/login` (email OTP); signed-in customers get an account menu (**My trips** → `/dashboard/trips`). Estimate and Summary use a black trip field strip under the header.

## Customer dashboard

Routes under `/dashboard` use a sidebar shell (`components/dashboard/`). Email OTP customer session is required (`DashboardAuthGate`); anonymous sessions cannot load dashboard data.

| Area | Route | Data |
|------|-------|------|
| My Trips | `/dashboard/trips`, `/dashboard/trips/[tripId]` | Firestore collection group `trips` where `customerID == uid`; receipt via `billing.stripeReceiptUrl` |
| Account | `/dashboard/settings/account` | `users/{uid}` (read-only) |
| Billing settings | `/dashboard/settings/billing` | `users/{uid}/payment_methods` + callable `manageSavedCards` |
| Appearance | `/dashboard/settings/appearance` | Dashboard-only theme via `next-themes` |

Trip cancel matches mobile eligibility: status `requested` or `accepted` → `cancelled` on `branches/{branchId}/trips/{tripId}`.

OTP email delivery uses shared Cloud Functions (`requestAuthOtp` / `verifyAuthOtp`) and Resend via Functions secrets + `app_settings/email`. The Website does not configure Resend.

## Auth boundary

| Step | Auth |
|------|------|
| Browse marketing | None |
| Fare estimate / retail quote | Anonymous Auth (session) |
| Summary confirm / pay | Email OTP create-account or sign-in (`requestAuthOtp` / `verifyAuthOtp`) |
| Customer dashboard | Email OTP customer session |

Catalog and Mapbox country/proximity load via callable `getBookingCatalog` (Anonymous allowed). The website does **not** read Firestore catalog collections from the client.

Retail quotes use `buildTripQuote`. Authenticated callers without a `users/{uid}` profile (anonymous web sessions) get **card/retail-only** pricing. Redeploy Functions after that handler change.

Confirm uses `paymentsCreateCardPayment` (requires customer role). OTP verify provisions `users/{uid}` with `role: customer` when needed.

## Data

- **Catalog** — `getBookingCatalog` returns sanitized branches, mapbox context, eligible vehicle classes, and add-ons (Admin SDK; filters enabled/visible/capacity/service type)
- **Quotes** — `buildTripQuote` (server fare math)
- **Trips / payments** — same callables and document shapes as other clients (`journey.dropoff`, `scheduledPickupAt`, `vehicleClassId`, `addonIds` / `bookingAddons`, `capacity`)
- **Dashboard history** — customer-owned trips via Firestore collection group; Stripe receipt link on trip (`billing.stripeReceiptUrl` written by `stripeWebhook`); saved cards via `manageSavedCards`

Location (UI) = `branchId` in code. Do not call staff portal HTTP APIs from this app.

## Hardening

- Fail fast on missing Firebase / Mapbox env; Stripe publishable key optional until checkout / saved cards
- No service-account or Stripe secret keys in the client bundle
- Do not log addresses, phones, or payment refs
- Client totals are display-only; server recomputes fare on `paymentsCreateCardPayment`
- Booking steps guard incomplete state and send users back to `/booking`; guests are sent to `/login` before Summary pay
- No public Firestore rules for anonymous catalog reads

## Layout

See `.cursor/rules/structure-and-naming.mdc` for folders and naming. Marketing under `components/marketing/`; booking under `components/booking/`; dashboard under `components/dashboard/`; auth chrome under `components/auth/`; primitives under `components/ui/`.

## Environment

`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_FUNCTIONS_REGION`, `NEXT_PUBLIC_MAPBOX_TOKEN`, optional `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Validate in `lib/env.ts`. Enable Anonymous Auth and authorize this site’s domain for Auth, Mapbox, and Stripe. Deploy `getBookingCatalog` and updated `buildTripQuote`.
