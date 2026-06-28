import { initializeApp } from "firebase/app";
const key = process.env.GEMINI_API_KEY;
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  orderBy
} from "firebase/firestore";

// Configured from firebase-applet-config.json
const firebaseConfig = {
  apiKey: key,
  authDomain: "gen-lang-client-0159054621.firebaseapp.com",
  projectId: "gen-lang-client-0159054621",
  storageBucket: "gen-lang-client-0159054621.firebasestorage.app",
  messagingSenderId: "125870399745",
  appId: "1:125870399745:web:c6546c7d91f5892d35bb00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  orderBy
};
export type { User };
