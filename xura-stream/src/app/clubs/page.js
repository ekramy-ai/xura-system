'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

function ClubCard({ club }) {
  const initial = (club.name_ar || club.name_en || '؟')[0]
  return (
    <Link href={`/clubs/${club.id}`} className={styles.card}>
      <div className={styles.cardGlow} style={{ background: club.colors?.primary || 'var(--teal)' }} />
      <div className={styles.cardInner}>
        <div className={styles.logoWrap} style={{ borderColor: club.colors?.primary || 'var(--teal)' }}>
          {club.logo
            ? <img src={club.logo} alt={club.name_ar} width={64} height={64} style={{ objectFit: 'contain' }} />
            : <span className={styles.logoInitial} style={{ color: club.colors?.primary || 'var(--teal)' }}>{initial}</span>
          }
        </div>
        <h3 className={styles.clubName}>{club.name_ar || club.name_en}</h3>
        {club.name_en && <div className={styles.clubNameEn}>{club.name_en}</div>}
        <div className={styles.meta}>
          {club.city && <span className={styles.metaItem}>📍 {club.city}</span>}
          {club.founded && <span className={styles.metaItem}>📅 {club.founded}</span>}
        </div>
        {(club.teamsCount > 0 || club.teamsCount === 0) && (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{club.teamsCount || 0}</span>
              <span className={styles.statLabel}>فريق</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>{club.playersCount || 0}</span>
              <span className={styles.statLabel}>لاعب</span>
            </div>
          </div>
        )}
        <div className={styles.viewBtn}>
          عرض النادي ←
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px' }} />
      <div className="skeleton" style={{ height: 20, width: '70%', margin: '0 auto 8px' }} />
      <div className="skeleton" style={{ height: 14, width: '50%', margin: '0 auto' }} />
    </div>
  )
}

export default function ClubsPage() {
  const [clubs,   setClubs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    const q = query(collection(db, 'clubs'), orderBy('name_ar'))
    const unsub = onSnapshot(q, snap => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = clubs.filter(c => {
    const matchSearch = !search ||
      (c.name_ar || '').includes(search) ||
      (c.name_en || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.type === filter
    return matchSearch && matchFilter
  })

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className="container">
          <h1 className={styles.heroTitle}>🏟️ الأندية المشاركة</h1>
          <p className={styles.heroSub}>تعرّف على جميع الأندية والفرق المشاركة في بطولة XURA</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><b>{clubs.length}</b><span>نادي مشارك</span></div>
          </div>
        </div>
      </section>

      <section className={styles.sec}>
        <div className="container">
          {/* Search + Filter */}
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="ابحث عن نادي..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏟️</div>
              <h3>{search ? 'لا توجد نتائج' : 'لا توجد أندية بعد'}</h3>
              <p>{search ? `لا يوجد نادي بإسم "${search}"` : 'لم يتم إضافة أندية بعد'}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(c => <ClubCard key={c.id} club={c} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
