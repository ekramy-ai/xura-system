'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

export default function AdminSetupPage() {
  const { user, isAdmin, loading, loginWithGoogle, logout } = useAuth()
  const router = useRouter()

  const [step,      setStep]      = useState('checking') // checking | noAdmins | hasAdmins | done
  const [claiming,  setClaiming]  = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error,     setError]     = useState('')

  // Check if admins collection is empty
  useEffect(() => {
    const check = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'))
        if (snap.size > 0) {
          setStep('hasAdmins')
        } else {
          setStep('noAdmins')
        }
      } catch {
        setStep('noAdmins') // allow setup on error
      }
    }
    if (!loading) check()
  }, [loading])

  // Redirect if already admin
  useEffect(() => {
    if (!loading && isAdmin) router.push('/dashboard')
  }, [isAdmin, loading, router])

  const handleGoogle = async () => {
    setError('')
    setSigningIn(true)
    try {
      await loginWithGoogle()
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user')
        setError('فشل تسجيل الدخول: ' + (e.message || e.code))
    } finally {
      setSigningIn(false)
    }
  }

  const claimAdmin = async () => {
    if (!user) return
    setClaiming(true)
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        displayName: user.displayName || user.email || 'مسؤول',
        email: user.email || '',
        photoURL: user.photoURL || '',
        addedAt: serverTimestamp(),
        addedBy: 'self-setup',
      })
      setStep('done')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (e) {
      setError('خطأ: ' + e.message)
    } finally {
      setClaiming(false)
    }
  }

  if (loading || step === 'checking') return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.spinner} />
        <p style={{ color: 'var(--text3)', marginTop: 16 }}>جاري التحقق...</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoX}>XURA</span>
          <span className={styles.logoTag}>ADMIN SETUP</span>
        </div>

        {/* Step: hasAdmins */}
        {step === 'hasAdmins' && (
          <>
            <div className={styles.iconWrap} style={{ background: 'var(--amber-bg)' }}>🔒</div>
            <h1 className={styles.title}>النظام مُفعَّل بالفعل</h1>
            <p className={styles.sub}>
              يوجد مسؤولون مسجلون في النظام بالفعل.<br/>
              هذه الصفحة تعمل فقط عند الإعداد الأول.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              تسجيل الدخول →
            </Link>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <>
            <div className={styles.iconWrap} style={{ background: 'var(--green-bg)', fontSize: 40 }}>✅</div>
            <h1 className={styles.title}>تم إعداد حسابك بنجاح!</h1>
            <p className={styles.sub}>جاري التوجيه للوحة التحكم...</p>
            <div className={styles.spinner} style={{ margin: '16px auto 0' }} />
          </>
        )}

        {/* Step: noAdmins — not logged in */}
        {step === 'noAdmins' && !user && (
          <>
            <div className={styles.iconWrap} style={{ background: 'var(--teal-bg)' }}>⚙️</div>
            <h1 className={styles.title}>إعداد لوحة التحكم</h1>
            <p className={styles.sub}>
              مرحباً! هذه هي المرة الأولى لإعداد النظام.<br/>
              سجّل الدخول بـ Google لتكون المسؤول الأول.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <button
              className={styles.googleBtn}
              onClick={handleGoogle}
              disabled={signingIn}
            >
              {signingIn ? (
                <><div className={styles.btnSpinner} /> جاري تسجيل الدخول...</>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  الدخول بـ Google وإعداد النظام
                </>
              )}
            </button>

            <div className={styles.note}>
              🔒 هذه الصفحة تعمل مرة واحدة فقط — عند إعداد أول مسؤول للنظام
            </div>
          </>
        )}

        {/* Step: noAdmins — logged in, ready to claim */}
        {step === 'noAdmins' && user && (
          <>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" width={56} height={56} style={{ borderRadius: '50%' }} />
                  : (user.displayName || 'A')[0]
                }
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{user.displayName || 'مستخدم'}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user.email}</div>
              </div>
            </div>

            <div className={styles.iconWrap} style={{ background: 'var(--teal-bg)' }}>⚙️</div>
            <h1 className={styles.title}>تفعيل صلاحيات المسؤول</h1>
            <p className={styles.sub}>
              لا يوجد مسؤولون في النظام بعد.<br/>
              اضغط لتفعيل حسابك كمسؤول أول للنظام.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 12, gap: 10 }}
              onClick={claimAdmin}
              disabled={claiming}
            >
              {claiming ? '⏳ جاري التفعيل...' : '🚀 تفعيل حسابي كمسؤول'}
            </button>

            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}
            >
              تسجيل خروج والدخول بحساب آخر
            </button>
          </>
        )}
      </div>
    </div>
  )
}
