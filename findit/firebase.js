// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from 'firebase/functions';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACf-TbdBrPnc1ID7rIwshS3TA5pE47Q_8",
  authDomain: "findit-b94f6.firebaseapp.com",
  projectId: "findit-b94f6",
  storageBucket: "findit-b94f6.firebasestorage.app",
  messagingSenderId: "173468624020",
  appId: "1:173468624020:web:bb7a1c5b5939967ea6c081",
  measurementId: "G-4KT8VYME8P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

export { app, functions };