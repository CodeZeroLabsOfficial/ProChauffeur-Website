"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

import { appConfig, getFirebaseClientEnv } from "@/lib/env";

let cachedApp: FirebaseApp | null = null;

export function firebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const env = getFirebaseClientEnv();
  cachedApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
      });
  return cachedApp;
}

let cachedAuth: Auth | null = null;
export function firebaseAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(firebaseApp());
  return cachedAuth;
}

let cachedDb: Firestore | null = null;
export function firestore(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(firebaseApp());
  return cachedDb;
}

let cachedFunctions: Functions | null = null;
export function firebaseFunctions(): Functions {
  if (!cachedFunctions) {
    cachedFunctions = getFunctions(firebaseApp(), appConfig.functionsRegion);
  }
  return cachedFunctions;
}
