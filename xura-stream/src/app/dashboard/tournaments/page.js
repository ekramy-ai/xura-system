'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'

export default function DashboardTournamentsPage() {
  const { isAdmin } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [tourModal, setTourModal] = useState(false)
  const [catModal, setCatModal] = useState(null) // holds tournamentId
  const [teamModal, setTeamModal] = useState(null) // holds { tourId, catId }

  // Forms state
  const [tourName, setTourName] = useState('')
  const [catForm, setCatForm] = useState({ gender: 'boys', ageGroup: '' })
  const [teamForm, setTeamForm] = useState({ name_ar: '', name_en: '', color: '#14b8a6' })

  const [saving, setSaving] = useState(false)

  // Fetch data
  useEffect(() => {
    let rawTournaments = []
    let rawCategories = []
    let rawTeams = []

    const buildData = () => {
      const data = rawTournaments.map(t => {
        const tCats = rawCategories.filter(c => c.tournamentId === t.id).map(c => {
          const cTeams = rawTeams.filter(tm => tm.categoryId === c.id)
          return { ...c, teams: cTeams }
        })
        return { ...t, categories: tCats }
      })
      setTournaments(data)
      setLoading(false)
    }

    const unsubT = onSnapshot(collection(db, 'tournaments'), snap => {
      rawTournaments = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      buildData()
    })
    const unsubC = onSnapshot(collection(db, 'categories'), snap => {
      rawCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      buildData()
    })
    const unsubTm = onSnapshot(collection(db, 'teams'), snap => {
      rawTeams = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      buildData()
    })
    const unsubClubs = onSnapshot(collection(db, 'clubs'), snap => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubT(); unsubC(); unsubTm(); unsubClubs(); }
  }, [])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // --- Save Functions ---
  const saveTournament = async () => {
    if (!tourName.trim()) return alert('يرجى كتابة اسم البطولة')
    setSaving(true)
    try {
      const id = 'tour_' + generateId()
      await setDoc(doc(db, 'tournaments', id), { name: tourName.trim() })
      setTourModal(false)
      setTourName('')
    } catch (e) {
      alert('خطأ: ' + e.message)
    } finally { setSaving(false) }
  }

  const saveCategory = async () => {
    if (!catForm.ageGroup.trim()) return alert('يرجى كتابة المرحلة السنية')
    setSaving(true)
    try {
      const gender_ar = catForm.gender === 'boys' ? 'بنين' : (catForm.gender === 'girls' ? 'بنات' : 'مختلط')
      const id = 'cat_' + generateId()
      await setDoc(doc(db, 'categories', id), {
        tournamentId: catModal,
        gender: catForm.gender,
        gender_ar: gender_ar,
        ageGroup: catForm.ageGroup.trim()
      })
      setCatModal(null)
      setCatForm({ gender: 'boys', ageGroup: '' })
    } catch (e) {
      alert('خطأ: ' + e.message)
    } finally { setSaving(false) }
  }

  const saveTeam = async () => {
    if (!teamForm.name_ar.trim()) return alert('يرجى كتابة اسم الفريق')
    setSaving(true)
    try {
      const id = 'team_' + generateId()
      await setDoc(doc(db, 'teams', id), {
        categoryId: teamModal.catId,
        name_ar: teamForm.name_ar.trim(),
        name_en: teamForm.name_en.trim() || teamForm.name_ar.trim(),
        color: teamForm.color
      })
      setTeamModal(null)
      setTeamForm({ name_ar: '', name_en: '', color: '#14b8a6' })
    } catch (e) {
      alert('خطأ: ' + e.message)
    } finally { setSaving(false) }
  }

  // --- Delete Functions ---
  const handleDelete = async (collectionName, id, label) => {
    if (!isAdmin) return alert('صلاحيات غير كافية')
    if (!confirm(`هل أنت متأكد من حذف ${label}؟`)) return
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (e) {
      alert('خطأ أثناء الحذف: ' + e.message)
    }
  }

  const pickClub = (clubId) => {
    const c = clubs.find(x => x.id === clubId)
    if (c) {
      setTeamForm(f => ({ ...f, name_ar: c.name_ar, name_en: c.name_en || '', color: c.colors?.primary || '#14b8a6' }))
    }
  }

  if (!isAdmin) {
    return <div className="empty-state"><h3>صلاحيات غير كافية</h3></div>
  }

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>🏆 البطولات والفرق</h1>
          <p>إدارة البطولات، المراحل السنية، والفرق المشاركة</p>
        </div>
        <button className="btn btn-primary" onClick={() => setTourModal(true)}>+ إضافة بطولة</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>لا يوجد أي بطولات مضافة حالياً</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTourModal(true)}>+ إضافة أول بطولة</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {tournaments.map(tour => (
            <div key={tour.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, margin: 0, color: '#fff' }}>🏆 {tour.name}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setCatModal(tour.id)}>+ إضافة مرحلة</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete('tournaments', tour.id, 'البطولة بالكامل')}>حذف البطولة</button>
                </div>
              </div>

              {tour.categories?.length === 0 ? (
                <div className="empty-state" style={{ padding: 16 }}>لا يوجد مراحل سنية في هذه البطولة.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {tour.categories?.map(cat => (
                    <div key={cat.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 16, margin: 0, color: 'var(--blue)' }}>▪ {cat.gender_ar} - {cat.ageGroup}</h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setTeamModal({ tourId: tour.id, catId: cat.id })} style={{ padding: '4px 10px', fontSize: 12 }}>+ إضافة فريق</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('categories', cat.id, 'المرحلة السنية')} style={{ padding: '4px 8px', color: 'var(--danger)' }} title="حذف المرحلة">✕</button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cat.teams?.length === 0 ? (
                          <span style={{ color: 'var(--text3)', fontSize: 13 }}>لا توجد فرق مضافة</span>
                        ) : (
                          cat.teams?.map(team => (
                            <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, fontSize: 13 }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: team.color }} />
                              {team.name_ar}
                              <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 0, marginLeft: 4 }} onClick={() => handleDelete('teams', team.id, 'الفريق')} title="حذف الفريق">✕</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- Modals --- */}

      {/* Tournament Modal */}
      {tourModal && (
        <div className="modal-overlay" onClick={() => setTourModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
            <div className="modal-hd">
              <h2>إضافة بطولة جديدة</h2>
              <button className="modal-close" onClick={() => setTourModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>اسم البطولة</label>
              <input className="form-control" value={tourName} onChange={e => setTourName(e.target.value)} placeholder="مثال: بطولة الجمهورية 2026" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setTourModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveTournament} disabled={saving}>{saving ? '⏳ جاري الحفظ...' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="modal-overlay" onClick={() => setCatModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
            <div className="modal-hd">
              <h2>إضافة مرحلة جديدة</h2>
              <button className="modal-close" onClick={() => setCatModal(null)}>✕</button>
            </div>
            <div className="form-group">
              <label>النوع (بنين / بنات)</label>
              <select className="form-control" value={catForm.gender} onChange={e => setCatForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="boys">بنين</option>
                <option value="girls">بنات</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>
            <div className="form-group">
              <label>المرحلة السنية</label>
              <input className="form-control" value={catForm.ageGroup} onChange={e => setCatForm(f => ({ ...f, ageGroup: e.target.value }))} placeholder="مثال: U18 أو الدرجة الأولى" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setCatModal(null)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveCategory} disabled={saving}>{saving ? '⏳ جاري الحفظ...' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {teamModal && (
        <div className="modal-overlay" onClick={() => setTeamModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
            <div className="modal-hd">
              <h2>إضافة فريق جديد</h2>
              <button className="modal-close" onClick={() => setTeamModal(null)}>✕</button>
            </div>
            {clubs.length > 0 && (
              <div className="form-group">
                <label>اختر من الأندية المضافة مسبقاً</label>
                <select className="form-control" onChange={e => pickClub(e.target.value)}>
                  <option value="">— اختر نادي للربط السريع —</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>اسم الفريق (بالعربية)</label>
              <input className="form-control" value={teamForm.name_ar} onChange={e => setTeamForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="مثال: الزمالك" />
            </div>
            <div className="form-group">
              <label>اسم الفريق (بالانجليزية)</label>
              <input className="form-control" value={teamForm.name_en} onChange={e => setTeamForm(f => ({ ...f, name_en: e.target.value }))} placeholder="مثال: Zamalek" dir="ltr" />
            </div>
            <div className="form-group">
              <label>لون قميص الفريق الأساسي</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="color" value={teamForm.color} onChange={e => setTeamForm(f => ({ ...f, color: e.target.value }))} style={{ width: 44, height: 40, border: 'none', borderRadius: 8 }} />
                <input className="form-control" value={teamForm.color} onChange={e => setTeamForm(f => ({ ...f, color: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setTeamModal(null)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveTeam} disabled={saving}>{saving ? '⏳ جاري الحفظ...' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
