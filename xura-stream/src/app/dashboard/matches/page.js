'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

import { db } from '@/lib/firebase'
import {
  collection, query, onSnapshot, orderBy, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

const STATUS_LABELS = { live: 'مباشر', finished: 'منتهية', upcoming: 'قادمة' }
const STATUS_BADGE  = { live: 'badge-red', finished: 'badge-teal', upcoming: 'badge-amber' }

const EMPTY_MATCH = {
  tournament: 'بطولة XURA',
  status: 'upcoming',
  home: { name_ar: '', color: '#14b8a6', clubId: '' },
  away: { name_ar: '', color: '#3b82f6', clubId: '' },
  currentSetNum: 1,
  stream_youtube_id: '',
}

export default function DashboardMatchesPage() {
  const [matches, setMatches] = useState([])
  const [clubs,   setClubs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY_MATCH)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'matches')), s => {
      setMatches(s.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const u2 = onSnapshot(query(collection(db, 'clubs'), orderBy('name_ar')), s => {
      setClubs(s.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2() }
  }, [])

  const openAdd = () => { setForm(EMPTY_MATCH); setEditId(null); setModal('add') }
  const openEdit = (m) => {
    setForm({
      tournament: m.tournament || '',
      status: m.status || 'upcoming',
      home: { name_ar: m.home?.name_ar || '', color: m.home?.color || '#14b8a6', clubId: m.home?.clubId || '' },
      away: { name_ar: m.away?.name_ar || '', color: m.away?.color || '#3b82f6', clubId: m.away?.clubId || '' },
      currentSetNum: m.currentSetNum || 1,
      stream_youtube_id: m.stream_youtube_id || '',
    })
    setEditId(m.id); setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, updatedAt: serverTimestamp() }
      if (modal === 'add') await addDoc(collection(db, 'matches'), { ...payload, createdAt: serverTimestamp() })
      else await updateDoc(doc(db, 'matches', editId), payload)
      setModal(null)
    } catch (e) { alert('خطأ: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('حذف المباراة؟')) return
    await deleteDoc(doc(db, 'matches', id))
  }

  const setTeam = (side, key, val) => setForm(f => ({ ...f, [side]: { ...f[side], [key]: val } }))

  // Auto-fill team name from club selection
  const pickClub = (side, clubId) => {
    const c = clubs.find(x => x.id === clubId)
    setTeam(side, 'clubId', clubId)
    if (c) { setTeam(side, 'name_ar', c.name_ar); setTeam(side, 'color', c.colors?.primary || (side === 'home' ? '#14b8a6' : '#3b82f6')) }
  }

  const filtered = matches.filter(m => filter === 'all' || m.status === filter)
    .sort((a, b) => (a.status === 'live' ? -1 : 1))

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>⚡ المباريات</h1>
          <p>إدارة جميع المباريات والبطولات</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة مباراة</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'live', 'upcoming', 'finished'].map(f => (
          <button key={f}
            className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'الكل' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3>لا توجد مباريات</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>+ إضافة مباراة</button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>البطولة</th><th>المباراة</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{m.tournament || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.home?.color || 'var(--teal)' }} />
                        <b style={{ color: 'var(--text)' }}>{m.home?.name_ar || 'TBD'}</b>
                      </span>
                      <span style={{ color: 'var(--text3)', fontWeight: 700 }}>
                        {(m.status !== 'upcoming') ? `${m.currentHomeScore ?? 0} - ${m.currentAwayScore ?? 0}` : 'vs'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <b style={{ color: 'var(--text)' }}>{m.away?.name_ar || 'TBD'}</b>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.away?.color || 'var(--blue)' }} />
                      </span>
                    </div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[m.status] || 'badge-teal'}`}>{STATUS_LABELS[m.status] || m.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/referee.html?matchId=${m.id}`} className="btn btn-primary btn-sm">تحكم 🎮</Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>حذف</button>
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
              <h2>{modal === 'add' ? '+ إضافة مباراة' : '✏️ تعديل المباراة'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>البطولة</label>
                <input className="form-control" value={form.tournament} onChange={e => setForm(f => ({ ...f, tournament: e.target.value }))} placeholder="بطولة XURA" />
              </div>
              <div className="form-group">
                <label>الحالة</label>
                <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="upcoming">قادمة</option>
                  <option value="live">مباشر</option>
                  <option value="finished">منتهية</option>
                </select>
              </div>

              <div className="form-group">
                <label>YouTube Stream ID (معرف البث)</label>
                <input
                  className="form-control"
                  value={form.stream_youtube_id}
                  onChange={e => setForm(f => ({ ...f, stream_youtube_id: e.target.value }))}
                  placeholder="مثال: dQw4w9WgXcQ"
                  dir="ltr"
                />
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  انسخ الكود الموجود بعد `v=` في رابط اليوتيوب
                </p>
              </div>

              {/* Home team */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>الفريق الأول (مضيف)</div>
              {clubs.length > 0 && (
                <div className="form-group">
                  <label>اختر من الأندية</label>
                  <select className="form-control" value={form.home.clubId} onChange={e => pickClub('home', e.target.value)}>
                    <option value="">— اختر نادي —</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                </div>
              )}
              <div className="grid-2">
                <div className="form-group">
                  <label>الاسم بالعربي</label>
                  <input className="form-control" value={form.home.name_ar} onChange={e => setTeam('home', 'name_ar', e.target.value)} placeholder="نادي الأهلي" />
                </div>
                <div className="form-group">
                  <label>لون الفريق</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={form.home.color} onChange={e => setTeam('home', 'color', e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8 }} />
                    <input className="form-control" value={form.home.color} onChange={e => setTeam('home', 'color', e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Away team */}
              <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>الفريق الثاني (ضيف)</div>
              {clubs.length > 0 && (
                <div className="form-group">
                  <label>اختر من الأندية</label>
                  <select className="form-control" value={form.away.clubId} onChange={e => pickClub('away', e.target.value)}>
                    <option value="">— اختر نادي —</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                </div>
              )}
              <div className="grid-2">
                <div className="form-group">
                  <label>الاسم بالعربي</label>
                  <input className="form-control" value={form.away.name_ar} onChange={e => setTeam('away', 'name_ar', e.target.value)} placeholder="نادي الزمالك" />
                </div>
                <div className="form-group">
                  <label>لون الفريق</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={form.away.color} onChange={e => setTeam('away', 'color', e.target.value)} style={{ width: 44, height: 40, border: 'none', borderRadius: 8 }} />
                    <input className="form-control" value={form.away.color} onChange={e => setTeam('away', 'color', e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ جاري الحفظ...' : modal === 'add' ? '✅ إضافة المباراة' : '✅ حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
