'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import Link from 'next/link'

const EMPTY_CLUB = {
  name_ar: '', name_en: '', city: '', founded: '', type: '',
  logo: '', description: '',
  colors: { primary: '#14b8a6', secondary: '#3b82f6' },
  contact: { phone: '', email: '', address: '' },
  social: { facebook: '', instagram: '', twitter: '' },
}

export default function DashboardClubsPage() {
  const [clubs,   setClubs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // null | 'add' | 'edit'
  const [form,    setForm]    = useState(EMPTY_CLUB)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'clubs'), orderBy('name_ar'))
    const unsub = onSnapshot(q, snap => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const openAdd = () => { setForm(EMPTY_CLUB); setEditId(null); setModal('add') }
  const openEdit = (club) => {
    setForm({
      name_ar: club.name_ar || '', name_en: club.name_en || '',
      city: club.city || '', founded: club.founded || '', type: club.type || '',
      logo: club.logo || '', description: club.description || '',
      colors: { primary: club.colors?.primary || '#14b8a6', secondary: club.colors?.secondary || '#3b82f6' },
      contact: { phone: club.contact?.phone || '', email: club.contact?.email || '', address: club.contact?.address || '' },
      social: { facebook: club.social?.facebook || '', instagram: club.social?.instagram || '', twitter: club.social?.twitter || '' },
    })
    setEditId(club.id)
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name_ar.trim()) return alert('الاسم بالعربي مطلوب')
    setSaving(true)
    try {
      const payload = { ...form, updatedAt: serverTimestamp() }
      if (modal === 'add') {
        await addDoc(collection(db, 'clubs'), { ...payload, createdAt: serverTimestamp() })
      } else {
        await updateDoc(doc(db, 'clubs', editId), payload)
      }
      setModal(null)
    } catch (e) { alert('خطأ: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟ سيتم حذف كل بياناته.')) return
    setDeleting(id)
    try { await deleteDoc(doc(db, 'clubs', id)) }
    catch (e) { alert('خطأ: ' + e.message) }
    finally { setDeleting(null) }
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setNested = (group, key, val) => setForm(f => ({ ...f, [group]: { ...f[group], [key]: val } }))

  const filtered = clubs.filter(c =>
    !search || (c.name_ar || '').includes(search) || (c.name_en || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>🏟️ الأندية</h1>
          <p>إدارة الأندية والفرق والبيانات الكاملة</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة نادي</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 24 }}>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        <input
          className="form-control"
          style={{ paddingRight: 40 }}
          placeholder="بحث عن نادي..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏟️</div>
          <h3>{search ? 'لا توجد نتائج' : 'لا توجد أندية بعد'}</h3>
          <p>{search ? `لا يوجد نادي بإسم "${search}"` : 'ابدأ بإضافة أول نادي'}</p>
          {!search && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>+ إضافة نادي</button>}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>النادي</th>
                <th>المدينة</th>
                <th>التأسيس</th>
                <th>اللون</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(club => (
                <tr key={club.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'var(--surface2)',
                        border: `2px solid ${club.colors?.primary || 'var(--teal)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {club.logo
                          ? <img src={club.logo} alt="" width={36} height={36} style={{ objectFit: 'contain' }} />
                          : <span style={{ fontSize: 16, color: club.colors?.primary || 'var(--teal)', fontWeight: 800 }}>
                              {(club.name_ar || '؟')[0]}
                            </span>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{club.name_ar}</div>
                        {club.name_en && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{club.name_en}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{club.city || '—'}</td>
                  <td>{club.founded || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: club.colors?.primary || '#14b8a6' }} title="رئيسي" />
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: club.colors?.secondary || '#3b82f6' }} title="ثانوي" />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link href={`/dashboard/clubs/${club.id}`} className="btn btn-ghost btn-sm">الفرق</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(club)}>تعديل</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(club.id)}
                        disabled={deleting === club.id}
                      >
                        {deleting === club.id ? '...' : 'حذف'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <h2>{modal === 'add' ? '+ إضافة نادي جديد' : '✏️ تعديل النادي'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Basic Info */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: -4 }}>بيانات أساسية</div>
              <div className="grid-2">
                <div className="form-group">
                  <label>الاسم بالعربي *</label>
                  <input className="form-control" value={form.name_ar} onChange={e => setField('name_ar', e.target.value)} placeholder="مثال: نادي الأهلي" />
                </div>
                <div className="form-group">
                  <label>الاسم بالإنجليزية</label>
                  <input className="form-control" value={form.name_en} onChange={e => setField('name_en', e.target.value)} placeholder="Al Ahly" dir="ltr" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>المدينة</label>
                  <input className="form-control" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="القاهرة" />
                </div>
                <div className="form-group">
                  <label>سنة التأسيس</label>
                  <input className="form-control" value={form.founded} onChange={e => setField('founded', e.target.value)} placeholder="1907" dir="ltr" />
                </div>
              </div>
              <div className="form-group">
                <label>رابط اللوجو (URL)</label>
                <input className="form-control" value={form.logo} onChange={e => setField('logo', e.target.value)} placeholder="https://..." dir="ltr" />
                {form.logo && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={form.logo} alt="preview" width={48} height={48} style={{ objectFit: 'contain', borderRadius: 8, background: 'var(--surface2)', padding: 4 }} onError={e => e.target.style.display = 'none'} />
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>معاينة اللوجو</span>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>وصف النادي</label>
                <textarea className="form-control" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="نبذة عن النادي..." />
              </div>

              {/* Colors */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: -4 }}>الألوان</div>
              <div className="grid-2">
                <div className="form-group">
                  <label>اللون الرئيسي</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={form.colors.primary} onChange={e => setNested('colors', 'primary', e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                    <input className="form-control" value={form.colors.primary} onChange={e => setNested('colors', 'primary', e.target.value)} dir="ltr" style={{ flex: 1 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>اللون الثانوي</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={form.colors.secondary} onChange={e => setNested('colors', 'secondary', e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                    <input className="form-control" value={form.colors.secondary} onChange={e => setNested('colors', 'secondary', e.target.value)} dir="ltr" style={{ flex: 1 }} />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: -4 }}>التواصل</div>
              <div className="grid-2">
                <div className="form-group">
                  <label>رقم الهاتف</label>
                  <input className="form-control" value={form.contact.phone} onChange={e => setNested('contact', 'phone', e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" />
                </div>
                <div className="form-group">
                  <label>البريد الإلكتروني</label>
                  <input className="form-control" type="email" value={form.contact.email} onChange={e => setNested('contact', 'email', e.target.value)} placeholder="club@example.com" dir="ltr" />
                </div>
              </div>
              <div className="form-group">
                <label>العنوان</label>
                <input className="form-control" value={form.contact.address} onChange={e => setNested('contact', 'address', e.target.value)} placeholder="مثال: 12 شارع النيل، القاهرة" />
              </div>

              {/* Social */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: -4 }}>السوشيال ميديا</div>
              <div className="form-group">
                <label>Facebook</label>
                <input className="form-control" value={form.social.facebook} onChange={e => setNested('social', 'facebook', e.target.value)} placeholder="https://facebook.com/..." dir="ltr" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Instagram</label>
                  <input className="form-control" value={form.social.instagram} onChange={e => setNested('social', 'instagram', e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
                </div>
                <div className="form-group">
                  <label>Twitter / X</label>
                  <input className="form-control" value={form.social.twitter} onChange={e => setNested('social', 'twitter', e.target.value)} placeholder="https://x.com/..." dir="ltr" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ جاري الحفظ...' : modal === 'add' ? '✅ إضافة النادي' : '✅ حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
