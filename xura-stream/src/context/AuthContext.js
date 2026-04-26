'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, googleProvider } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isReferee, setIsReferee] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        console.log("Current User UID:", u.uid); // Debug helper
        
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', u.uid)
        await setDoc(userRef, {
          displayName: u.displayName || 'مستخدم',
          email: u.email,
          photoURL: u.photoURL,
          lastLogin: serverTimestamp(),
        }, { merge: true })

        // Check roles
        try {
          const snap = await getDoc(doc(db, 'admins', u.uid))
          setIsAdmin(snap.exists())

          const refSnap = await getDoc(doc(db, 'referees', u.uid))
          setIsReferee(refSnap.exists())
          
          // Get full user profile including subscription
          const profileSnap = await getDoc(userRef)
          if (profileSnap.exists()) {
            setProfile(profileSnap.data())
          }
        } catch {
          setIsAdmin(false)
          setIsReferee(false)
          setProfile(null)
        }
      } else {
        setIsAdmin(false)
        setIsReferee(false)
        setProfile(null)
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

  const purchaseSubscription = async (planType, tournamentId = null) => {
    if (!user) throw new Error('Not logged in')
    
    // Mock network delay for payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    let currentSub = profile?.subscription || { plan: 'free', expiresAt: null, unlockedTournaments: [] }
    let newTournaments = currentSub.unlockedTournaments || []

    if (planType === 'monthly') {
      currentSub.plan = 'premium'
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      currentSub.expiresAt = d
    } else if (planType === 'yearly') {
      currentSub.plan = 'premium'
      const d = new Date()
      d.setFullYear(d.getFullYear() + 1)
      currentSub.expiresAt = d
    } else if (planType === 'tourPass' && tournamentId) {
      if (!newTournaments.includes(tournamentId)) {
        newTournaments.push(tournamentId)
      }
      currentSub.unlockedTournaments = newTournaments
    }

    // Update Firestore
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { subscription: currentSub })
    
    // Update local state immediately
    setProfile(prev => ({ ...prev, subscription: currentSub }))
    return true
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isReferee, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, purchaseSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
