'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import {
  doc, onSnapshot, collection, query, orderBy,
  addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs
} from 'firebase/firestore'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const EMPTY_TEAM = { category: 'boys', ageGroup: 'seniors', season: '2025-2026', name: '' }
const EMPTY_PLAYER = { name: '', number: '', position: '', birthDate: '', nationality: 'مصري', photo: '' }
const EMPTY_STAFF  = { name: '', role: 'coach', photo: '' }

const CATS = { boys: 'أولاد', girls: 'بنات', mixed: 'مختلط' }
const AGE_GROUPS = { u14:'تحت 14', u16:'تحت 16', u18:'تحت 18', u20:'تحت 20', u21:'تحت 21', seniors:'كبار' }
const POSITIONS  = { setter:'مُمرِّر', libero:'ليبيرو', outside:'ضارب خارجي', opposite:'معاكس', middle:'وسط', ds:'متخصص دفاع' }
const STAFF_ROLES = { coach:'المدرب الرئيسي', assistant:'مدرب مساعد', physio:'فيزيوثيرابي', analyst:'محلل فيديو', manager:'مدير الفريق' }

export default function ClubDetailDashboard() {
  const { clubId } = useParams()
  const [club,     setClub]     = useState(null)
  const [teams,    setTeams]    = useState([])
  const [selTeam,  setSelTeam]  = useState(null)
  const [players,  setPlayers]  = useState([])
  const [staff,    setStaff]    = useState([])
  const [loading,  setLoading]  = useState(true)

  // Modals: null | { type: 'team'|'player'|'staff', mode: 'add'|'edit', data?, id? }
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clubs', clubId), s => {
      setClub(s.exists() ? { id: s.id, ...s.data() } : null)
      setLoading(false)
    })
    return unsub
  }, [clubId])

  useEffect(() => {
    const q = query(collection(db, 'clubs', clubId, 'teams'), orderBy('category'))
    const unsub = onSnapshot(q, s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [clubId])

  useEffect(() => {
    if (!selTeam) { setPlayers([]); setStaff([]); return }
    const u1 = onSnapshot(
      query(collection(db, 'clubs', clubId, 'teams', selTeam, 'players'), orderBy('number')),
      s => setPlayers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(
      collection(db, 'clubs', clubId, 'teams', selTeam, 'staff'),
      s => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { u1(); u2() }
  }, [clubId, selTeam])

  const openModal = (type, mode, data = null) => {
    const defaults = type === 'team' ? EMPTY_TEAM : type === 'player' ? EMPTY_PLAYER : EMPTY_STAFF
    setForm(data ? { ...defaults, ...data } : { ...defaults })
    setModal({ type, mode, id: data?.id || null })
  }

  const handleSave = async () => {
    const { type, mode, id } = modal
    setSaving(true)
    try {
      const basePath = `clubs/${clubId}`
      if (type === 'team') {
        const col = collection(db, basePath, 'teams')
        if (mode === 'add') await addDoc(col, { ...form, createdAt: serverTimestamp() })
        else await updateDoc(doc(db, basePath, 'teams', id), form)
      } else if (type === 'player') {
        const col = collection(db, basePath, 'teams', selTeam, 'players')
        const payload = { ...form, number: Number(form.number) || 0 }
        if (mode === 'add') await addDoc(col, payload)
        else await updateDoc(doc(db, basePath, 'teams', selTeam, 'players', id), payload)
      } else {
        const col = collection(db, basePath, 'teams', selTeam, 'staff')
        if (mode === 'add') await addDoc(col, form)
        else await updateDoc(doc(db, basePath, 'teams', selTeam, 'staff', id), form)
      }
      setModal(null)
    } catch (e) { alert('خطأ: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (type, id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const basePath = `clubs/${clubId}`
    try {
      if (type === 'team') {
        // delete sub-collections manually (players + staff)
        const pSnap = await getDocs(collection(db, basePath, 'teams', id, 'players'))
        const sSnap = await getDocs(collection(db, basePath, 'teams', id, 'staff'))
        await Promise.all([...pSnap.docs, ...sSnap.docs].map(d => deleteDoc(d.ref)))
        await deleteDoc(doc(db, basePath, 'teams', id))
        if (selTeam === id) setSelTeam(null)
      } else if (type === 'player') {
        await deleteDoc(doc(db, basePath, 'teams', selTeam, 'players', id))
      } else {
        await deleteDoc(doc(db, basePath, 'teams', selTeam, 'staff', id))
      }
    } catch (e) { alert('خطأ: ' + e.message) }
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <div style={{ padding: 40, color: 'var(--text3)' }}>⏳ جاري التحميل...</div>
  if (!club)   return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <h3>النادي غير موجود</h3>
      <Link href="/dashboard/clubs" className="btn btn-ghost" style={{ marginTop: 16 }}>← الأندية</Link>
    </div>
  )

  const selTeamObj = teams.find(t => t.id === selTeam)

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
        <Link href="/dashboard/clubs" style={{ color: 'var(--teal)' }}>الأندية</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{club.name_ar}</span>
        {selTeamObj && <><span>/</span><span>{CATS[selTeamObj.category]} — {AGE_GROUPS[selTeamObj.ageGroup]}</span></>}
      </div>

      <div className="page-hd">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--surface2)',
            border: `2px solid ${club.colors?.primary || 'var(--teal)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {club.logo
              ? <img src={club.logo} alt="" width={48} height={48} style={{ objectFit: 'contain' }} />
              : <span style={{ fontSize: 22, color: club.colors?.primary || 'var(--teal)', fontWeight: 800 }}>{(club.name_ar||'؟')[0]}</span>
            }
          </div>
          <div>
            <h1 style={{ fontSize: 22 }}>{club.name_ar}</h1>
            <p>{club.name_en || club.city || ''}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('team', 'add')}>+ إضافة فريق</button>
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {teams.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>لا توجد فرق بعد. ابدأ بإضافة فريق ↑</div>
        ) : teams.map(t => (
          <button
            key={t.id}
            onClick={() => setSelTeam(selTeam === t.id ? null : t.id)}
            className={selTeam === t.id ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 13, gap: 6 }}
          >
            {CATS[t.category]} — {AGE_GROUPS[t.ageGroup] || t.ageGroup}
            {t.season && <span style={{ fontSize: 11, opacity: .7 }}>({t.season})</span>}
          </button>
        ))}
        {teams.map(t => (
          <div key={`act-${t.id}`} style={{ display: selTeam === t.id ? 'flex' : 'none', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal('team', 'edit', { ...t })}>✏️</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete('team', t.id)}>🗑️</button>
          </div>
        ))}
      </div>

      {/* Team detail: players + staff */}
      {selTeam && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Players */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700 }}>⚽ اللاعبون <span className="badge badge-blue" style={{ marginRight: 8 }}>{players.length}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => openModal('player', 'add')}>+ إضافة</button>
            </div>
            {players.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-icon" style={{ fontSize: 32 }}>⚽</div>
                <h3 style={{ fontSize: 15 }}>لا يوجد لاعبون</h3>
                <p style={{ fontSize: 13 }}>اضغط على + إضافة لإضافة لاعب</p>
              </div>
            ) : (
              <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>#</th><th>الاسم</th><th>المركز</th><th></th></tr></thead>
                  <tbody>
                    {players.map(p => (
                      <tr key={p.id}>
                        <td><b style={{ color: 'var(--teal)' }}>#{p.number}</b></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          {p.nationality && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.nationality}</div>}
                        </td>
                        <td><span className="badge badge-teal">{POSITIONS[p.position] || p.position || '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openModal('player', 'edit', { ...p })}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete('player', p.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Staff */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700 }}>🎽 الجهاز الفني <span className="badge badge-purple" style={{ marginRight: 8 }}>{staff.length}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => openModal('staff', 'add')}>+ إضافة</button>
            </div>
            {staff.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-icon" style={{ fontSize: 32 }}>🎽</div>
                <h3 style={{ fontSize: 15 }}>لا يوجد جهاز فني</h3>
                <p style={{ fontSize: 13 }}>اضغط على + إضافة لإضافة عضو</p>
              </div>
            ) : (
              <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>الاسم</th><th>المنصب</th><th></th></tr></thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</td>
                        <td><span className="badge badge-purple">{STAFF_ROLES[s.role] || s.role}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openModal('staff', 'edit', { ...s })}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete('staff', s.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <h2>
                {modal.type === 'team'   ? (modal.mode === 'add' ? '+ إضافة فريق'    : '✏️ تعديل الفريق') : ''}
                {modal.type === 'player' ? (modal.mode === 'add' ? '+ إضافة لاعب'    : '✏️ تعديل اللاعب') : ''}
                {modal.type === 'staff'  ? (modal.mode === 'add' ? '+ إضافة عضو جهاز فني' : '✏️ تعديل عضو الجهاز الفني') : ''}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Team form */}
              {modal.type === 'team' && (<>
                <div className="grid-2">
                  <div className="form-group">
                    <label>الفئة</label>
                    <select className="form-control" value={form.category} onChange={e => setField('category', e.target.value)}>
                      <option value="boys">أولاد</option>
                      <option value="girls">بنات</option>
                      <option value="mixed">مختلط</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الفئة العمرية</label>
                    <select className="form-control" value={form.ageGroup} onChange={e => setField('ageGroup', e.target.value)}>
                      {Object.entries(AGE_GROUPS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>الموسم</label>
                  <input className="form-control" value={form.season} onChange={e => setField('season', e.target.value)} placeholder="2025-2026" dir="ltr" />
                </div>
                <div className="form-group">
                  <label>اسم إضافي (اختياري)</label>
                  <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="مثال: الفريق الأول" />
                </div>
              </>)}

              {/* Player form */}
              {modal.type === 'player' && (<>
                <div className="grid-2">
                  <div className="form-group">
                    <label>الاسم *</label>
                    <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="اسم اللاعب" />
                  </div>
                  <div className="form-group">
                    <label>رقم القميص</label>
                    <input className="form-control" type="number" value={form.number} onChange={e => setField('number', e.target.value)} placeholder="7" dir="ltr" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>المركز</label>
                    <select className="form-control" value={form.position} onChange={e => setField('position', e.target.value)}>
                      <option value="">— اختر —</option>
                      {Object.entries(POSITIONS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الجنسية</label>
                    <input className="form-control" value={form.nationality} onChange={e => setField('nationality', e.target.value)} placeholder="مصري" />
                  </div>
                </div>
                <div className="form-group">
                  <label>تاريخ الميلاد</label>
                  <input className="form-control" type="date" value={form.birthDate} onChange={e => setField('birthDate', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label>رابط صورة اللاعب</label>
                  <input className="form-control" value={form.photo} onChange={e => setField('photo', e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
              </>)}

              {/* Staff form */}
              {modal.type === 'staff' && (<>
                <div className="form-group">
                  <label>الاسم *</label>
                  <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="اسم عضو الجهاز الفني" />
                </div>
                <div className="form-group">
                  <label>المنصب</label>
                  <select className="form-control" value={form.role} onChange={e => setField('role', e.target.value)}>
                    {Object.entries(STAFF_ROLES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>رابط الصورة</label>
                  <input className="form-control" value={form.photo} onChange={e => setField('photo', e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
              </>)}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ جاري الحفظ...' : modal.mode === 'add' ? '✅ إضافة' : '✅ حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
