'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

export default function DashboardUsersPage() {
  const { user: me } = useAuth()
  const [admins,  setAdmins]  = useState([])
  const [loading, setLoading] = useState(true)
  const [newUid,  setNewUid]  = useState('')
  const [newName, setNewName] = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const addAdmin = async () => {
    if (!newUid.trim()) return alert('ادخل الـ UID الخاص بالمستخدم')
    setSaving(true)
    try {
      await setDoc(doc(db, 'admins', newUid.trim()), {
        displayName: newName.trim() || 'مسؤول',
        addedAt: serverTimestamp(),
        addedBy: me?.uid,
      })
      setNewUid(''); setNewName('')
    } catch (e) { alert('خطأ: ' + e.message) }
    finally { setSaving(false) }
  }

  const removeAdmin = async (uid) => {
    if (uid === me?.uid) return alert('لا يمكنك إزالة صلاحياتك الخاصة')
    if (!confirm('هل أنت متأكد من إزالة هذا المسؤول؟')) return
    await deleteDoc(doc(db, 'admins', uid))
  }

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>👥 المستخدمون والصلاحيات</h1>
          <p>إدارة حسابات المسؤولين عن النظام</p>
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

      {/* Add admin */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r2)', padding: 24, marginBottom: 24,
      }}>
        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>+ إضافة مسؤول جديد</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
            <label>UID المستخدم</label>
            <input className="form-control" value={newUid} onChange={e => setNewUid(e.target.value)} placeholder="Firebase UID" dir="ltr" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label>الاسم (اختياري)</label>
            <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المسؤول" />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={addAdmin} disabled={saving}>
              {saving ? '⏳...' : '+ إضافة'}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
          💡 لإيجاد الـ UID: اطلب من المستخدم تسجيل الدخول ثم انظر إلى Firebase Authentication Console
        </div>
      </div>

      {/* Admins list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
          ⚙️ المسؤولون الحاليون <span className="badge badge-amber" style={{ marginRight: 8 }}>{admins.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: 20 }}>
            {[0,1].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />)}
          </div>
        ) : admins.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <div className="empty-icon" style={{ fontSize: 32 }}>👥</div>
            <h3 style={{ fontSize: 15 }}>لا يوجد مسؤولون</h3>
            <p style={{ fontSize: 13 }}>أضف الـ UID الخاص بك أولاً</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>الاسم</th><th>الـ UID</th><th>أضيف بواسطة</th><th></th></tr></thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-bg)', border: '1.5px solid rgba(20,184,166,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 700 }}>
                        {(a.displayName || '؟')[0]}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{a.displayName || 'مسؤول'}</span>
                      {a.id === me?.uid && <span className="badge badge-teal" style={{ fontSize: 10 }}>أنت</span>}
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12, color: 'var(--text3)' }}>{a.id}</code></td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.addedBy || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeAdmin(a.id)} disabled={a.id === me?.uid}>
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
