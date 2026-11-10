# Elite Chauffeurs Website

Customer-facing marketing site and booking funnel for the Elite Chauffeurs brand.

## Stack

- Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui
- Firebase Auth, Firestore, callable Functions (same stamp as ops portal / mobile)
- Mapbox (address search and maps)

## Getting started

1. Enable **Anonymous Auth** on the Firebase stamp (Authentication → Sign-in method). Required for guest fare estimates.
2. Authorize this site’s domain under Firebase Authentication → Settings → Authorized domains (and Mapbox URL restrictions).
3. Install and configure env:

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_* values for this stamp
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
