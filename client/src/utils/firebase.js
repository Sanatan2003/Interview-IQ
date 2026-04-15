
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY ,
  authDomain: "interviewiq-2839f.firebaseapp.com",
  projectId: "interviewiq-2839f",
  storageBucket: "interviewiq-2839f.firebasestorage.app",
  messagingSenderId: "666514386570",
  appId: "1:666514386570:web:4ad7fdafb1965549e10773"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export {auth, provider}