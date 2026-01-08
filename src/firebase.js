// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGnlhZC0vUA0Ntllu8CunZmh4JbCdHbBE",
  authDomain: "lifeos-2f274.firebaseapp.com",
  projectId: "lifeos-2f274",
  storageBucket: "lifeos-2f274.firebasestorage.app",
  messagingSenderId: "770881798860",
  appId: "1:770881798860:web:18e6bf682193be20b0f869"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as ferramentas para usarmos no resto do app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);