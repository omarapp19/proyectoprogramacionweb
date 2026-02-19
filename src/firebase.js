
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Reemplaza estos valores con los de tu consola de Firebase
// Project Settings > General > Your apps > Firebase SDK snippet > Config
const firebaseConfig = {
    apiKey: "AIzaSyC0ntRua4VpuJd5uAZsucGQ6lQxOh5qtuM",
    authDomain: "proyectourbe-89282.firebaseapp.com",
    projectId: "proyectourbe-89282",
    storageBucket: "proyectourbe-89282.firebasestorage.app",
    messagingSenderId: "901339700456",
    appId: "1:901339700456:web:978faad7e44bd647807d5d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
