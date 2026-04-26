'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

export default function DashboardUsersPage() {
  const { user: me } = useAuth()
  const [admins,   setAdmins]   = useState([])
  const [referees, setReferees] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [newUid,   setNewUid]   = useState('')
  const [newName,  setNewName]  = useState('')
  const [newRole,  setNewRole]  = useState('referee') // referee | admin
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'admin' })))
    })
    const u2 = onSnapshot(collection(db, 'referees'), snap => {
      setReferees(snap.docs.map(d => ({ id: d.id, ...d.data(), role: 'referee' })))
      setLoading(false)
    })
    return () => { u1(); u2() }
  }, [])

  const addUser = async () => {
    if (!newUid.trim()) return alert('ادخل الـ UID الخاص بالمستخدم')
    setSaving(true)
    try {
      const col = newRole === 'admin' ? 'admins' : 'referees'
      await setDoc(doc(db, col, newUid.trim()), {
        displayName: newName.trim() || (newRole === 'admin' ? 'مسؤول' : 'حكم'),
        addedAt: serverTimestamp(),
        addedBy: me?.uid,
      })
      setNewUid(''); setNewName('')
    } catch (e) { alert('خطأ: ' + e.message) }
    finally { setSaving(false) }
  }

  const removeUser = async (uid, role) => {
    if (uid === me?.uid) return alert('لا يمكنك إزالة صلاحياتك الخاصة')
    if (!confirm(`هل أنت متأكد من إزالة صلاحيات الـ ${role === 'admin' ? 'مسؤول' : 'حكم'}؟`)) return
    const col = role === 'admin' ? 'admins' : 'referees'
    await deleteDoc(doc(db, col, uid))
  }

  const allUsers = [...admins, ...referees].sort((a,b) => a.role.localeCompare(b.role))

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>👥 المستخدمون والصلاحيات</h1>
          <p>إدارة حسابات المسؤولين والحكام</p>
        </div>
      </div>

      {/* My UID */}
      <div style={{
        background: 'var(--teal-bg)', border: '1px solid rgba(20,184,166,.2)',
        borderRadius: 'var(--r2)', padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>الـ UID الخاص بك</div>
          <code style={{ fontSize: 13, color: 'var(--teal)', background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>{me?.uid}</code>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>انسخ هذا الـ UID وأضفه كمسؤول إذا لم تكن مضافاً بعد</div>
        </div>
      </div>

      {/* Add User */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r2)', padding: 24, marginBottom: 24,
      }}>
        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>+ إضافة صلاحيات لمستخدم</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
            <label>UID المستخدم</label>
            <input className="form-control" value={newUid} onChange={e => setNewUid(e.target.value)} placeholder="Firebase UID" dir="ltr" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label>الاسم (اختياري)</label>
            <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)} placeholder="الاسم" />
          </div>
          <div className="form-group" style={{ width: 120 }}>
            <label>نوع الصلاحية</label>
            <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="referee">حكم 🏐</option>
              <option value="admin">مسؤول ⚙️</option>
            </select>
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={addUser} disabled={saving}>
              {saving ? '⏳...' : '+ إضافة'}
            </button>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
          👥 المستخدمون الحاليون <span className="badge badge-amber" style={{ marginRight: 8 }}>{allUsers.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 20 }}>
            {[0,1].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />)}
          </div>
        ) : allUsers.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <div className="empty-icon" style={{ fontSize: 32 }}>👥</div>
            <h3 style={{ fontSize: 15 }}>لا يوجد مستخدمون</h3>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>الاسم</th><th>الصلاحية</th><th>الـ UID</th><th>أضيف بواسطة</th><th></th></tr></thead>
            <tbody>
              {allUsers.map(a => (
                <tr key={`${a.role}-${a.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: a.role === 'admin' ? 'var(--amber-bg)' : 'var(--teal-bg)', border: '1.5px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.role === 'admin' ? 'var(--amber)' : 'var(--teal)', fontWeight: 700 }}>
                        {(a.displayName || '؟')[0]}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{a.displayName}</span>
                      {a.id === me?.uid && a.role === 'admin' && <span className="badge badge-teal" style={{ fontSize: 10 }}>أنت</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.role === 'admin' ? 'badge-amber' : 'badge-teal'}`}>
                      {a.role === 'admin' ? 'مسؤول ⚙️' : 'حكم 🏐'}
                    </span>
                  </td>
                  <td><code style={{ fontSize: 12, color: 'var(--text3)' }}>{a.id}</code></td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.addedBy || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeUser(a.id, a.role)} disabled={a.id === me?.uid && a.role === 'admin'}>
                      إزالة
                    </button>
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
