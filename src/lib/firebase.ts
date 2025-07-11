import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// 🚨 ATENÇÃO: CONFIGURAÇÃO DO FIREBASE 🚨
// -----------------------------------------------------------------------------
// As chaves abaixo são apenas placeholders. Você PRECISA substituí-las pelas
// credenciais REAIS do seu projeto Firebase para que as funcionalidades
// que dependem do Firestore (como cache de quizzes e histórico) funcionem.
//
// Você pode encontrar essas informações nas configurações do seu projeto Firebase:
// Project Settings > General > Your apps > Web app > SDK setup and configuration
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
let app;

// This check prevents the app from being initialized multiple times,
// which can happen in a development environment with hot-reloading.
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getFirestore(app);
