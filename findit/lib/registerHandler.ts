// lib/registerHandler.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export async function registerWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
