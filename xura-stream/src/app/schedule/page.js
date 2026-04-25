'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

function ScheduleCard({ match }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const date = match.recorded_at ? new Date(match.recorded_at).toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' }) : 'قريباً'
  const time = match.recorded_at ? new Date(match.recorded_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className={`${styles.card} ${isLive ? styles.liveCard : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.date}>{date}</span>
        {isLive ? (
          <span className="live-badge"><span className="live-dot" /> مباشر الآن</span>
        ) : (
          <span className={styles.time}>{time}</span>
        )}
      </div>
      
      <div className={styles.teams}>
        <div className={styles.team}>
          <span className={styles.teamName}>{match.home?.name_ar || 'TBD'}</span>
        </div>
        <div className={styles.vs}>VS</div>
        <div className={styles.team}>
          <span className={styles.teamName}>{match.away?.name_ar || 'TBD'}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.tournament}>{match.tournament || 'بطولة XURA'}</span>
        <Link href={`/watch/${match.id}`} className={`btn ${isLive ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
          {isLive ? 'شاهد البث' : isFinished ? 'النتيجة' : 'التفاصيل'}
        </Link>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'live' | 'upcoming' | 'finished'

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('status', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMatches(all)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = matches.filter(m => {
    if (filter === 'all') return true
    return m.status === filter
  })

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>جدول المباريات</h1>
          <p className={styles.sub}>تابع مواعيد البث المباشر لجميع البطولات</p>
          
          <div className={styles.filters}>
            {['all', 'live', 'finished'].map(f => (
              <button 
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'الكل' : f === 'live' ? 'مباشر' : 'منتهية'}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className={styles.list}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>لا توجد مباريات في هذا القسم حالياً</div>
        ) : (
          <div className={styles.list}>
            {filtered.map(m => <ScheduleCard key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}
