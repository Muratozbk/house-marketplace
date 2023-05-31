import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpNo08O1Ld1jUCLtsFvI9xYz5ExU5LvPA",
    authDomain: "house-marketplace-app-e1e76.firebaseapp.com",
    projectId: "house-marketplace-app-e1e76",
    storageBucket: "house-marketplace-app-e1e76.appspot.com",
    messagingSenderId: "681252616223",
    appId: "1:681252616223:web:6305de6d8812508d48bd2a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// initializeApp(firebaseConfig);
export const db = getFirestore(app)