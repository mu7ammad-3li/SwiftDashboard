// src/lib/firebase.ts (Admin Panel)

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// --- BEGIN APP CHECK IMPORTS ---
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  AppCheck,
} from "firebase/app-check";
// --- END APP CHECK IMPORTS ---

import firebaseConfig from "./firebaseConfig"; // Your admin panel's Firebase config

// --- BEGIN APP CHECK CONFIG ---
// You'll need a reCAPTCHA v3 site key for your admin panel.
// It can be the same as your eCommerce app or a new one.
// Ensure this environment variable is set in your admin panel's .env file.

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// --- BEGIN APP CHECK INITIALIZATION ---
let appCheck: AppCheck | null = null;
if (firebaseConfig.recaptchaV3SiteKey) {
  try {
    // Ensure 'app' is defined before using it
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaV3SiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log(
      "[Firebase Admin] App Check initialized successfully with reCAPTCHA v3."
    );
  } catch (error) {
    console.error(
      "[Firebase Admin Init Error] App Check initialization failed:",
      error
    );
  }
} else {
  console.warn(
    "[Firebase Admin] App Check not initialized: VITE_ADMIN_RECAPTCHA_V3_SITE_KEY is missing. Backend resources may be less protected."
  );
}
// --- END APP CHECK INITIALIZATION ---

const db: Firestore = getFirestore(app, "bellaegyptdb"); // Assuming same DB name
const auth = getAuth(app);
// Removed storage as it wasn't in your original admin firebase.ts, add if needed

// Export appCheck along with other Firebase services
export { auth, db, app, appCheck }; // Add appCheck here
