// ============================================================
// Beyond Borders — Firebase configuration
// ============================================================
// Fill this in with the config values from your OWN Firebase
// project (Project settings → General → Your apps → SDK setup
// and configuration → "Config"). See FIREBASE_SETUP.md for the
// full step-by-step walkthrough.
//
// This file is loaded by index.html and admin.html.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDHUGUVHKagJ4cGI8-5FKHJi8T8GXBMNi4",
  authDomain: "bbsoc-beyondborders.firebaseapp.com",
  projectId: "bbsoc-beyondborders",
  storageBucket: "bbsoc-beyondborders.firebasestorage.app",
  messagingSenderId: "46444907119",
  appId: "1:46444907119:web:c69b965e0b0fa0a54ddb9a",
  measurementId: "G-M9KGMGL2Y"
};

// Email addresses allowed to see the admin dashboard (admin.html).
// This list is ALSO checked server-side in the Firestore security
// rules — editing it here only changes what the admin page tries
// to show, it does not by itself grant access. See FIREBASE_SETUP.md.
const ADMIN_EMAILS = [
  "eleanor.wang@kcl.ac.uk",
  "fatima.rajani@kcl.ac.uk",
  "yuejia.chen@kcl.ac.uk"
];

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
