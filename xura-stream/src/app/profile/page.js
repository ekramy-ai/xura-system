'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import styles from './page.module.css'

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return <div className="flex-center" style={{ height: '60vh' }}>جاري التحميل...</div>

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.avatar}>
              {user.photoURL ? <img src={user.photoURL} alt="" /> : user.email[0].toUpperCase()}
            </div>
            <h1 className={styles.name}>{user.displayName || 'مستخدم XURA'}</h1>
            <p className={styles.email}>{user.email}</p>
          </div>

          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span>نوع الحساب</span>
              <span className={styles.badge}>مجاني (Free)</span>
            </div>
            <div className={styles.infoRow}>
              <span>تاريخ التسجيل</span>
              <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ar-EG') : 'غير معروف'}</span>
            </div>
          </div>

          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}
