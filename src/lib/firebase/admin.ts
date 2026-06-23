import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

let app;

// Safely verify if key has valid PEM format to prevent crash during build time
const isValidPem = privateKey && privateKey.includes("-----BEGIN PRIVATE KEY-----");

if (getApps().length === 0) {
  try {
    if (projectId && clientEmail && isValidPem) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin SDK initialized successfully via cert.");
    } else {
      // Setup a dummy fallback for static builds or development without keys
      app = initializeApp({
        projectId: projectId || "dummy-project-id",
      });
      console.log("Firebase Admin SDK initialized with local dummy fallback config (no cert).");
    }
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    // If all fails, attempt default credentials or fallback to active app
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp();
    }
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
