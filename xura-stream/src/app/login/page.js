'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { user, isAdmin, isReferee, loading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [name, setName]   = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorMap = {
    'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/email-already-in-use': 'البريد الإلكتروني مسجل مسبقاً',
    'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
    'auth/popup-closed-by-user': '',
  }

  // Auto-redirect when logged in
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isReferee) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    }
  }, [user, isAdmin, isReferee, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email, pass)
      } else {
        await registerWithEmail(email, pass, name)
      }
      // Redirect handled by useEffect
    } catch (err) {
      setError(errorMap[err.code] || 'حدث خطأ، حاول مرة أخرى')
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(''); setIsSubmitting(true)
    try {
      await loginWithGoogle()
      // Redirect handled by useEffect
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setError(errorMap[err.code] || 'حدث خطأ مع Google')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoX}>XURA</span>
          <span className={styles.logoTag}>STREAM</span>
        </div>

        <h1 className={styles.title}>
          {mode === 'login' ? 'أهلاً بعودتك 👋' : 'إنشاء حساب جديد'}
        </h1>
        <p className={styles.sub}>
          {mode === 'login'
            ? 'سجّل دخولك لمتابعة البث المباشر'
            : 'شاهد مباريات الكرة الطائرة مجاناً'}
        </p>

        {/* Google Button */}
        <button className={styles.googleBtn} onClick={handleGoogle} disabled={isSubmitting}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          المتابعة بـ Google
        </button>

        <div className={styles.divider}><span>أو</span></div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label>الاسم</label>
              <input
                type="text"
                placeholder="اسمك الكامل"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className={styles.field}>
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className={styles.field}>
            <label>كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isSubmitting}>
            {isSubmitting ? '⏳ جاري التحميل...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className={styles.switchMode}>
          {mode === 'login' ? (
            <>ليس لديك حساب؟{' '}
              <button onClick={() => { setMode('register'); setError('') }}>
                أنشئ حساباً
              </button>
            </>
          ) : (
            <>لديك حساب؟{' '}
              <button onClick={() => { setMode('login'); setError('') }}>
                سجّل دخول
              </button>
            </>
          )}
        </p>

        <Link href="/" className={styles.backLink}>← العودة للرئيسية</Link>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link href="/admin-setup" style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', borderRadius: 8, transition: 'var(--tr)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--amber)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)' }}
          >
            ⚙️ دخول لوحة الإدارة (Admin)
          </Link>
        </div>
      </div>
    </div>
  )
}
