'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, collection, query, orderBy, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import styles from './page.module.css'

const POSITIONS = {
  setter: 'مُمرِّر', libero: 'ليبيرو', outside: 'ضارب خارجي',
  opposite: 'معاكس', middle: 'وسط', ds: 'متخصص دفاع'
}
const STAFF_ROLES = {
  coach: 'المدرب الرئيسي', assistant: 'مدرب مساعد',
  physio: 'فيزيوثيرابي', analyst: 'محلل فيديو', manager: 'مدير الفريق'
}
const CATS = { boys: '👦 أولاد', girls: '👧 بنات', mixed: '⚡ مختلط' }
const AGE_GROUPS = {
  u14: 'تحت 14', u16: 'تحت 16', u18: 'تحت 18',
  u20: 'تحت 20', u21: 'تحت 21', seniors: 'كبار'
}

function PlayerRow({ player }) {
  return (
    <div className={styles.playerRow}>
      <div className={styles.playerNumber} style={{ borderColor: 'var(--teal)' }}>
        #{player.number || '—'}
      </div>
      <div className={styles.playerAvatar}>
        {player.photo
          ? <img src={player.photo} alt={player.name} width={40} height={40} />
          : (player.name || '؟')[0]
        }
      </div>
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>{player.name}</div>
        {player.nationality && <div className={styles.playerNat}>{player.nationality}</div>}
      </div>
      {player.position && (
        <span className={`badge badge-teal ${styles.posBadge}`}>
          {POSITIONS[player.position] || player.position}
        </span>
      )}
    </div>
  )
}

function StaffRow({ member }) {
  return (
    <div className={styles.staffRow}>
      <div className={styles.staffAvatar}>
        {member.photo
          ? <img src={member.photo} alt={member.name} width={40} height={40} />
          : (member.name || '؟')[0]
        }
      </div>
      <div className={styles.staffInfo}>
        <div className={styles.staffName}>{member.name}</div>
        <div className={styles.staffRole}>{STAFF_ROLES[member.role] || member.role || 'جهاز فني'}</div>
      </div>
    </div>
  )
}

export default function ClubDetailPage() {
  const { clubId } = useParams()
  const [club,     setClub]     = useState(null)
  const [teams,    setTeams]    = useState([])
  const [openTeam, setOpenTeam] = useState(null)
  const [players,  setPlayers]  = useState({})  // teamId → players[]
  const [staff,    setStaff]    = useState({})   // teamId → staff[]
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'clubs', clubId), snap => {
      if (snap.exists()) setClub({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    return unsub
  }, [clubId])

  useEffect(() => {
    const q = query(collection(db, 'clubs', clubId, 'teams'), orderBy('category'))
    const unsub = onSnapshot(q, snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [clubId])

  const loadTeamDetails = async (teamId) => {
    if (players[teamId]) { setOpenTeam(openTeam === teamId ? null : teamId); return }
    setOpenTeam(teamId)
    const [pSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, 'clubs', clubId, 'teams', teamId, 'players'), orderBy('number'))),
      getDocs(collection(db, 'clubs', clubId, 'teams', teamId, 'staff'))
    ])
    setPlayers(p => ({ ...p, [teamId]: pSnap.docs.map(d => ({ id: d.id, ...d.data() })) }))
    setStaff(s => ({ ...s, [teamId]: sSnap.docs.map(d => ({ id: d.id, ...d.data() })) }))
  }

  if (loading) return (
    <div className={styles.page}>
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 20, marginBottom: 24 }} />
        <div className={styles.teamGrid}>
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </div>
    </div>
  )

  if (!club) return (
    <div className={styles.page}>
      <div className="container empty-state" style={{ paddingTop: 80 }}>
        <div className="empty-icon">❌</div>
        <h3>النادي غير موجود</h3>
        <Link href="/clubs" className="btn btn-ghost" style={{ marginTop: 16 }}>← العودة للأندية</Link>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Club Header */}
      <section className={styles.header}>
        <div className={styles.headerBg} style={{ background: `linear-gradient(135deg, ${club.colors?.primary || '#14b8a6'}22, transparent 60%)` }} />
        <div className="container">
          <Link href="/clubs" className={styles.backLink}>← الأندية</Link>
          <div className={styles.headerContent}>
            <div className={styles.clubLogo} style={{ borderColor: club.colors?.primary || 'var(--teal)' }}>
              {club.logo
                ? <img src={club.logo} alt={club.name_ar} width={96} height={96} style={{ objectFit: 'contain' }} />
                : <span style={{ fontSize: 40, color: club.colors?.primary || 'var(--teal)' }}>
                    {(club.name_ar || '؟')[0]}
                  </span>
              }
            </div>
            <div className={styles.clubInfo}>
              <h1 className={styles.clubName}>{club.name_ar}</h1>
              {club.name_en && <div className={styles.clubNameEn}>{club.name_en}</div>}
              <div className={styles.clubMeta}>
                {club.city && <span>📍 {club.city}</span>}
                {club.founded && <span>📅 تأسس {club.founded}</span>}
              </div>
              {club.description && <p className={styles.clubDesc}>{club.description}</p>}
              <div className={styles.socialLinks}>
                {club.contact?.phone && <a href={`tel:${club.contact.phone}`} className={styles.socialBtn}>📞</a>}
                {club.social?.facebook && <a href={club.social.facebook} target="_blank" rel="noopener" className={styles.socialBtn}>f</a>}
                {club.social?.instagram && <a href={club.social.instagram} target="_blank" rel="noopener" className={styles.socialBtn}>📸</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className={styles.sec}>
        <div className="container">
          <div className="sec-hd">
            <h2>⚡ الفرق والتشكيلات</h2>
            <span className="badge badge-teal">{teams.length} فريق</span>
          </div>

          {teams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>لا توجد فرق بعد</h3>
              <p>لم يتم إضافة فرق لهذا النادي بعد</p>
            </div>
          ) : (
            <div className={styles.teamsWrap}>
              {teams.map(team => (
                <div key={team.id} className={styles.teamCard}>
                  <button
                    className={styles.teamHeader}
                    onClick={() => loadTeamDetails(team.id)}
                  >
                    <div className={styles.teamTitle}>
                      <span className={styles.teamCat}>{CATS[team.category] || team.category}</span>
                      <span className={styles.teamAge}>{AGE_GROUPS[team.ageGroup] || team.ageGroup || ''}</span>
                      {team.season && <span className={styles.teamSeason}>{team.season}</span>}
                    </div>
                    <span className={`${styles.teamChevron} ${openTeam === team.id ? styles.open : ''}`}>▼</span>
                  </button>

                  {openTeam === team.id && (
                    <div className={styles.teamBody}>
                      {/* Players */}
                      <div className={styles.teamSection}>
                        <h4 className={styles.sectionTitle}>
                          ⚽ اللاعبون
                          {players[team.id] && <span className="badge badge-blue" style={{ marginRight: 8 }}>{players[team.id].length}</span>}
                        </h4>
                        {!players[team.id] ? (
                          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>⏳ جاري التحميل...</div>
                        ) : players[team.id].length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>لا يوجد لاعبون مسجلون</div>
                        ) : (
                          <div className={styles.playersList}>
                            {players[team.id].map(p => <PlayerRow key={p.id} player={p} />)}
                          </div>
                        )}
                      </div>

                      {/* Staff */}
                      <div className={styles.teamSection}>
                        <h4 className={styles.sectionTitle}>
                          🎽 الجهاز الفني
                          {staff[team.id] && <span className="badge badge-purple" style={{ marginRight: 8 }}>{staff[team.id].length}</span>}
                        </h4>
                        {!staff[team.id] ? (
                          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>⏳ جاري التحميل...</div>
                        ) : staff[team.id].length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>لا يوجد جهاز فني مسجل</div>
                        ) : (
                          <div className={styles.staffList}>
                            {staff[team.id].map(s => <StaffRow key={s.id} member={s} />)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
