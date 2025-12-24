// firebase-init.js

// Подключаем Firebase версии 12.7.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ТВОЙ КОНФИГ
const firebaseConfig = {
    apiKey: "AIzaSyD_r0wvxZ_HMiRwkyWAX3-GwmT9ev1-G0s",
    authDomain: "party2025-6e6f4.firebaseapp.com",
    projectId: "party2025-6e6f4",
    storageBucket: "party2025-6e6f4.firebasestorage.app",
    messagingSenderId: "636929474470",
    appId: "1:636929474470:web:54f593e4231cefbcda1967"
};

// Запускаем
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Экспортируем базу, чтобы использовать в других файлах
export { db };