'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '@/lib/firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)

  const loginWithEmail = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass)

  const registerWithEmail = async (email, pass, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    if (name) await updateProfile(cred.user, { displayName: name })
    return cred
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
