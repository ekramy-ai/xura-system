'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'
import styles from './page.module.css'

export default function ProfilePage() {
  const { user, profile, isAdmin, isReferee, loading, logout } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [matches, setMatches] = useState([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (isReferee && user?.uid) {
      setFetching(true)
      const q = query(collection(db, 'matches'), where('assignedReferee', '==', user.uid))
      const unsub = onSnapshot(q, snap => {
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setFetching(false)
      })
      return unsub
    }
  }, [isReferee, user?.uid])

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
              <span className={`${styles.badge} ${profile?.subscription?.plan === 'premium' ? styles.premium : ''}`}>
                {profile?.subscription?.plan === 'premium' ? '👑 Premium' : 'مجاني (Free)'}
              </span>
            </div>
            {profile?.subscription?.plan === 'premium' && profile?.subscription?.expiresAt && (
              <div className={styles.infoRow}>
                <span>تاريخ انتهاء الاشتراك</span>
                <span>{profile.subscription.expiresAt.toDate ? profile.subscription.expiresAt.toDate().toLocaleDateString('ar-EG') : new Date(profile.subscription.expiresAt).toLocaleDateString('ar-EG')}</span>
              </div>
            )}
            {profile?.subscription?.unlockedTournaments?.length > 0 && (
              <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <span>البطولات المفتوحة</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.subscription.unlockedTournaments.map(tid => (
                    <span key={tid} className={styles.badge} style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>🎟️ {tid}</span>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.infoRow}>
              <span>تاريخ التسجيل</span>
              <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ar-EG') : 'غير معروف'}</span>
            </div>
          </div>

          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}>
            {t('nav.logout')}
          </button>
        </div>

        {isReferee && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 20, textAlign: 'right' }}>📊 المباريات المكلف بها (حكم)</h2>
            {fetching ? (
              <div className="skeleton" style={{ height: 100 }} />
            ) : matches.length === 0 ? (
              <div className={styles.info} style={{ textAlign: 'center', padding: 40 }}>
                لا توجد مباريات مسجلة باسمك حالياً.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {matches.map(m => (
                  <div key={m.id} className={styles.info} style={{ margin: 0, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{m.home?.name_ar} VS {m.away?.name_ar}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                          {m.tournament} - {m.gender} {m.ageGroup}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {m.status === 'live' && <span className="live-badge"><span className="live-dot" /> مباشر الآن</span>}
                          {m.status === 'upcoming' && <span className={styles.badge} style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>⏳ قادمة</span>}
                          {m.status === 'finished' && <span className={styles.badge} style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>✓ انتهت</span>}
                        </div>
                      </div>
                      <Link href={`/referee.html?matchId=${m.id}`} className="btn btn-primary btn-sm">
                        {m.status === 'live' ? 'إدارة المباراة 🎮' : (m.status === 'upcoming' ? 'دخول الغرفة ⏳' : 'عرض النتيجة 📋')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
