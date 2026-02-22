import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "REDACTED_FIREBASE_KEY",
    authDomain: "nutritrack-327c1.firebaseapp.com",
    projectId: "nutritrack-327c1",
    storageBucket: "nutritrack-327c1.firebasestorage.app",
    messagingSenderId: "527331333577",
    appId: "1:527331333577:web:0efb5bd83bfc34124c4418",
    measurementId: "G-EK7P4MJSCB"
};

// 1. Inicializar la aplicación (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializar Auth de forma estándar para React Native
// initializeAuth es el método correcto para configurar persistencia
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export { auth };
export default app;
