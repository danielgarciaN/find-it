// lib/loginHandler.ts
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
