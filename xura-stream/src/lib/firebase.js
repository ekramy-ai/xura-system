import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDY3k5KR2NDncsFtee7u6pXMMi1WvwYq7c",
  authDomain: "xura-system.firebaseapp.com",
  projectId: "xura-system",
  storageBucket: "xura-system.firebasestorage.app",
  messagingSenderId: "184949976586",
  appId: "1:184949976586:web:3d70738663ec1d43f639f3"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db  = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
