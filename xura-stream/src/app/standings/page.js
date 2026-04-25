'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import styles from './page.module.css'

const CATS = { boys: 'أولاد', girls: 'بنات', mixed: 'مختلط' }
const AGE_GROUPS = { u14: 'تحت 14', u16: 'تحت 16', u18: 'تحت 18', u20: 'تحت 20', seniors: 'كبار' }

export default function StandingsPage() {
  const [clubs,    setClubs]    = useState([])
  const [matches,  setMatches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [ageFilter, setAgeFilter] = useState('all')

  useEffect(() => {
    const q1 = onSnapshot(query(collection(db, 'clubs'), orderBy('name_ar')), snap => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const q2 = onSnapshot(query(collection(db, 'matches')), snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => { q1(); q2() }
  }, [])

  // Build standings from finished matches
  const standings = {}
  matches.filter(m => m.status === 'finished').forEach(m => {
    const hId = m.home?.clubId || m.home?.id
    const aId = m.away?.clubId || m.away?.id
    if (!hId || !aId) return
    const hScore = m.currentHomeScore ?? m.homeSets ?? 0
    const aScore = m.currentAwayScore ?? m.awaySets ?? 0
    if (!standings[hId]) standings[hId] = { played:0, won:0, lost:0, pts:0, setsW:0, setsL:0 }
    if (!standings[aId]) standings[aId] = { played:0, won:0, lost:0, pts:0, setsW:0, setsL:0 }
    standings[hId].played++
    standings[aId].played++
    standings[hId].setsW += hScore; standings[hId].setsL += aScore
    standings[aId].setsW += aScore; standings[aId].setsL += hScore
    if (hScore > aScore) { standings[hId].won++; standings[hId].pts += 3; standings[aId].lost++; standings[aId].pts += 0 }
    else if (aScore > hScore) { standings[aId].won++; standings[aId].pts += 3; standings[hId].lost++; standings[hId].pts += 0 }
    else { standings[hId].pts += 1; standings[aId].pts += 1 }
  })

  const tableRows = clubs
    .map(c => ({ ...c, ...(standings[c.id] || { played:0, won:0, lost:0, pts:0, setsW:0, setsL:0 }) }))
    .sort((a, b) => b.pts - a.pts || b.won - a.won)

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className="container">
          <h1 className={styles.heroTitle}>🏆 جدول الترتيب</h1>
          <p className={styles.heroSub}>ترتيب الأندية المحسوب من نتائج المباريات المسجّلة</p>
        </div>
      </section>

      <section className={styles.sec}>
        <div className="container">
          {loading ? (
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          ) : tableRows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>لا توجد بيانات بعد</h3>
              <p>سيتم تحديث الترتيب تلقائياً بعد انتهاء المباريات</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={`data-table ${styles.table}`}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>النادي</th>
                    <th>لعب</th>
                    <th>فوز</th>
                    <th>خسارة</th>
                    <th>الأشواط</th>
                    <th>النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr key={row.id} className={i === 0 ? styles.first : i === 1 ? styles.second : i === 2 ? styles.third : ''}>
                      <td>
                        <span className={styles.rank}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                      </td>
                      <td>
                        <div className={styles.clubCell}>
                          <div className={styles.clubDot} style={{ background: row.colors?.primary || 'var(--teal)' }} />
                          {row.logo && <img src={row.logo} alt="" width={28} height={28} style={{ objectFit:'contain', borderRadius:4 }} />}
                          <span className={styles.clubCellName}>{row.name_ar || row.name_en}</span>
                        </div>
                      </td>
                      <td>{row.played}</td>
                      <td><span style={{ color: 'var(--green)', fontWeight: 700 }}>{row.won}</span></td>
                      <td><span style={{ color: 'var(--red)' }}>{row.lost}</span></td>
                      <td style={{ fontSize: 12 }}>{row.setsW}:{row.setsL}</td>
                      <td>
                        <span className={styles.pts}>{row.pts}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
