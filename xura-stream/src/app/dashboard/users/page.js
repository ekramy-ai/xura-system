'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, where } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

function RefereeMatchesModal({ userId, userName, onClose }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'matches'), where('assignedReferee', '==', userId))
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [userId])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>مباريات الحكم: {userName}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>جاري التحميل...</div>
        ) : matches.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>لا توجد مباريات مسندة لهذا الحكم حالياً.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', padding: 4 }}>
            {matches.map(m => (
              <div key={m.id} style={{ background: 'var(--surface2)', padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>{m.home?.name_ar} VS {m.away?.name_ar}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{m.tournament}</div>
                </div>
                <div style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: m.status === 'live' ? 'var(--red-bg)' : 'var(--bg2)', color: m.status === 'live' ? 'var(--red)' : 'var(--text2)' }}>
                  {m.status === 'live' ? '🔴 مباشر' : (m.status === 'finished' ? '✓ منتهية' : '⏳ قادمة')}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>إغلاق</button>
      </div>
    </div>
  )
}

export default function DashboardUsersPage() {
  const { user: me } = useAuth()
  const [users,    setUsers]    = useState([])
  const [admins,   setAdmins]   = useState({})
  const [referees, setReferees] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [viewMatchesUser, setViewMatchesUser] = useState(null)

  useEffect(() => {
    // 1. Listen to all users
    const qUsers = query(collection(db, 'users'), orderBy('lastLogin', 'desc'))
    const unsubUsers = onSnapshot(qUsers, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    // 2. Listen to roles (mapped by UID for fast lookup)
    const unsubAdmins = onSnapshot(collection(db, 'admins'), snap => {
      const map = {}
      snap.docs.forEach(d => map[d.id] = true)
      setAdmins(map)
    })

    const unsubRefs = onSnapshot(collection(db, 'referees'), snap => {
      const map = {}
      snap.docs.forEach(d => map[d.id] = d.data())
      setReferees(map)
    })

    return () => { unsubUsers(); unsubAdmins(); unsubRefs() }
  }, [])

  const toggleRole = async (uid, role, currentVal) => {
    if (uid === me?.uid && role === 'admin') {
      alert('لا يمكنك إزالة صلاحيات الأدمن عن نفسك!')
      return
    }
    
    const col = role === 'admin' ? 'admins' : 'referees'
    const docRef = doc(db, col, uid)
    
    try {
      if (currentVal) {
        await deleteDoc(docRef)
      } else {
        const u = users.find(x => x.id === uid)
        await setDoc(docRef, {
          displayName: u?.displayName || 'مستخدم',
          email: u?.email || '',
          addedAt: serverTimestamp(),
          addedBy: me?.uid,
          pin: '0000' // Default PIN
        })
      }
    } catch (e) {
      alert('خطأ: ' + e.message)
    }
  }

  const updateSubscription = async (uid, currentSub) => {
    const isPremium = currentSub?.plan === 'premium'
    const newPlan = isPremium ? 'free' : 'premium'
    
    let newExpiresAt = null
    if (newPlan === 'premium') {
      const d = new Date()
      d.setMonth(d.getMonth() + 1) // default 1 month
      newExpiresAt = d
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        subscription: {
          plan: newPlan,
          expiresAt: newExpiresAt
        }
      })
    } catch (e) {
      alert('خطأ في تحديث الباقة: ' + e.message)
    }
  }

  const filtered = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.container}>
      <div className="page-hd">
        <div>
          <h1>👥 إدارة المستخدمين</h1>
          <p>تحكم في صلاحيات الوصول (أدمن / حكم)</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <b>{users.length}</b> مستخدم
          </div>
          <div className={styles.statItem}>
            <b style={{ color: 'var(--amber)' }}>{users.filter(u => !!admins[u.id]).length}</b> أدمن
          </div>
          <div className={styles.statItem}>
            <b style={{ color: 'var(--teal)' }}>{users.filter(u => !!referees[u.id]).length}</b> حكام
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>جاري تحميل المستخدمين...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الباقة (Subscription)</th>
                <th>آخر ظهور</th>
                <th style={{ textAlign: 'center' }}>صلاحية أدمن</th>
                <th style={{ textAlign: 'center' }}>صلاحية حكم / رمز (PIN)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={u.id === me?.uid ? styles.isMe : ''}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {u.photoURL ? <img src={u.photoURL} alt="" /> : u.displayName?.[0]}
                      </div>
                      <div>
                        <div className={styles.name}>
                          {u.displayName}
                          {u.id === me?.uid && <span className={styles.meTag}>أنت</span>}
                        </div>
                        <div className={styles.email}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => updateSubscription(u.id, u.subscription)}
                      className={`btn btn-sm ${u.subscription?.plan === 'premium' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                    >
                      {u.subscription?.plan === 'premium' ? '👑 Premium' : 'مجاني'}
                    </button>
                    {u.subscription?.plan === 'premium' && u.subscription?.expiresAt && (
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                        ينتهي: {u.subscription.expiresAt.toDate ? u.subscription.expiresAt.toDate().toLocaleDateString('ar-EG') : new Date(u.subscription.expiresAt).toLocaleDateString('ar-EG')}
                      </div>
                    )}
                  </td>
                  <td className={styles.date}>
                    {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={!!admins[u.id]} 
                        onChange={() => toggleRole(u.id, 'admin', admins[u.id])}
                      />
                      <span className={`${styles.slider} ${styles.adminSlider}`}></span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <label className={styles.switch}>
                        <input 
                          type="checkbox" 
                          checked={!!referees[u.id]} 
                          onChange={() => toggleRole(u.id, 'referee', referees[u.id])}
                        />
                        <span className={`${styles.slider} ${styles.refSlider}`}></span>
                      </label>
                      {!!referees[u.id] && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 'bold' }}>
                            PIN: {referees[u.id]?.pin || 'لم يحدد بعد'}
                          </div>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ fontSize: 9, padding: '2px 8px', color: 'var(--teal)', borderColor: 'rgba(20,184,166,0.2)' }}
                            onClick={() => setViewMatchesUser(u)}
                          >
                            👁 عرض مبارياته
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {viewMatchesUser && (
          <RefereeMatchesModal 
            userId={viewMatchesUser.id} 
            userName={viewMatchesUser.displayName || viewMatchesUser.email} 
            onClose={() => setViewMatchesUser(null)} 
          />
        )}
      </div>
    </div>
  )
}
