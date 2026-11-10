import { z } from "zod";

const firebaseClientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FUNCTIONS_REGION: z.string().min(1)
});

export type FirebaseClientEnv = z.infer<typeof firebaseClientSchema>;

const mapboxSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1)
});

const rawClientEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_FUNCTIONS_REGION: process.env.NEXT_PUBLIC_FUNCTIONS_REGION
};

let cachedFirebaseEnv: FirebaseClientEnv | null = null;

/** Firebase client config required for Auth, Firestore, and callables. */
export function getFirebaseClientEnv(): FirebaseClientEnv {
  if (cachedFirebaseEnv) return cachedFirebaseEnv;
  const parsed = firebaseClientSchema.safeParse(rawClientEnv);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Invalid or missing Firebase environment variables: ${missing}. ` +
        `Copy .env.example to .env.local and fill values for this stamp.`
    );
  }
  cachedFirebaseEnv = parsed.data;
  return cachedFirebaseEnv;
}

/** Mapbox public token for address search and maps. */
export function getMapboxToken(): string {
  const parsed = mapboxSchema.safeParse({
    NEXT_PUBLIC_MAPBOX_TOKEN: rawClientEnv.NEXT_PUBLIC_MAPBOX_TOKEN
  });
  if (!parsed.success) {
    throw new Error(
      "Missing NEXT_PUBLIC_MAPBOX_TOKEN. Add it to .env.local (URL-restrict in Mapbox)."
    );
  }
  const token = parsed.data.NEXT_PUBLIC_MAPBOX_TOKEN.trim();
  if (!token.startsWith("pk.")) {
    throw new Error(
      "NEXT_PUBLIC_MAPBOX_TOKEN must be a public token (pk.*), not a secret token (sk.*)."
    );
  }
  return token;
}

/** Cloud Functions region for this stamp. */
export const appConfig = {
  get functionsRegion() {
    return getFirebaseClientEnv().NEXT_PUBLIC_FUNCTIONS_REGION;
  }
};

/** Stripe publishable key for Payment Element (optional until checkout). */
export function getStripePublishableKey(): string | null {
  const value = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return value || null;
}
