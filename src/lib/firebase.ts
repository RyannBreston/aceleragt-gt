import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Importe o 'connectFunctionsEmulator' se precisar de testes locais no futuro
import { getFunctions } from 'firebase/functions';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ####################################################################
// ### CORREÇÃO APLICADA AQUI ###
// ####################################################################
// Estamos a especificar explicitamente a região das suas Cloud Functions.
// Isto resolve problemas de conexão em alguns casos.
const functions = getFunctions(app, 'us-central1');

// Se no futuro você usar o emulador local do Firebase, descomente a linha abaixo
// connectFunctionsEmulator(functions, "localhost", 5001);

export { app, auth, db, storage, functions };
