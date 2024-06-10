import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRu7CUEfR82-SI0lpxG9r36Zz_M8y_adY",
  authDomain: "vuesocial-5ebd2.firebaseapp.com",
  projectId: "vuesocial-5ebd2",
  storageBucket: "vuesocial-5ebd2.appspot.com",
  messagingSenderId: "988770607064",
  appId: "1:988770607064:web:e2a90aaa80dbbbffb29cad",
  measurementId: "G-M5PBRL3423",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
