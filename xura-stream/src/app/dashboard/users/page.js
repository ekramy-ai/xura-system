'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

export default function DashboardUsersPage() {
  const { user: me } = useAuth()
  const [users,    setUsers]    = useState([])
  const [admins,   setAdmins]   = useState({})
  const [referees, setReferees] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

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
      snap.docs.forEach(d => map[d.id] = true)
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
          addedBy: me?.uid
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
                <th style={{ textAlign: 'center' }}>صلاحية حكم</th>
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
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={!!referees[u.id]} 
                        onChange={() => toggleRole(u.id, 'referee', referees[u.id])}
                      />
                      <span className={`${styles.slider} ${styles.refSlider}`}></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
