'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, googleProvider } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
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
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        // Check if the user has an admin record in Firestore
        try {
          const snap = await getDoc(doc(db, 'admins', u.uid))
          setIsAdmin(snap.exists())
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
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
    <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
