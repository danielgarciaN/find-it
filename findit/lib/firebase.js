// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyA4vSaZ9ruGcwNfw7vftW3-KePhbkdwK6o',
    authDomain: 'findit-b94f6.firebaseapp.com',
    projectId: 'findit-b94f6',
    storageBucket: 'findit-b94f6.appspot.com',
    messagingSenderId: '173468624020',
    appId: '1:173468624020:android:d45683ebf5de58afa6c081',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);