# Elite Chauffeurs Website

Customer-facing marketing site and booking funnel for the Elite Chauffeurs brand.

## Stack

- Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui
- Firebase Auth, Firestore, callable Functions (same stamp as ops portal / mobile)
- Mapbox (address search and maps)

## Booking funnel

`/booking` → `/booking/details` → `/booking/payment` (email OTP) → `/booking/summary` (confirm + Stripe) → `/booking/confirmed`

Guest fare estimate uses Anonymous Auth. Email OTP is required before payment and confirm.

## Getting started

1. Enable **Anonymous Auth** on the Firebase stamp (Authentication → Sign-in method). Required for guest fare estimates.
2. Authorize this site’s domain under Firebase Authentication → Settings → Authorized domains (and Mapbox URL restrictions).
3. Redeploy Cloud Functions so `getBookingCatalog` and retail anonymous `buildTripQuote` are live, plus OTP / `createTripCardPayment`.
4. Install and configure env:

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_* values for this stamp
# Optional: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for card confirm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md). Cursor rules under `.cursor/rules/` define booking parity, security, naming, and code style.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
