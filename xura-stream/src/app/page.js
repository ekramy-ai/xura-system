'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-dot" />
      مباشر الآن
    </span>
  )
}

function MatchCard({ match, isLive }) {
  const homeName = match.home?.name_ar || 'الفريق الأول'
  const awayName = match.away?.name_ar || 'الفريق الثاني'
  const homeColor = match.home?.color || '#14b8a6'
  const awayColor = match.away?.color || '#3b82f6'
  const hScore = match.currentHomeScore ?? match.homeSets ?? 0
  const aScore = match.currentAwayScore ?? match.awaySets ?? 0

  return (
    <Link href={`/watch/${match.id}`} className={styles.matchCard}>
      {isLive && <div className={styles.cardLivePulse} />}

      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          {isLive && <LiveBadge />}
          {!isLive && <span className={styles.statusBadge}>{match.status === 'finished' ? 'انتهت' : 'قادمة'}</span>}
          <span className={styles.tournament}>{match.tournament || 'بطولة XURA'}</span>
        </div>
        {isLive && <span className={styles.setInfo}>ش {match.currentSetNum || 1}</span>}
      </div>

      <div className={styles.teamsRow}>
        <div className={styles.team}>
          <div className={styles.teamDot} style={{ background: homeColor }} />
          <span className={styles.teamName}>{homeName}</span>
        </div>
        <div className={styles.scorebox}>
          {isLive || match.status === 'finished' ? (
            <span className={styles.score}>
              <span style={{ color: homeColor }}>{hScore}</span>
              <span className={styles.scoreSep}>-</span>
              <span style={{ color: awayColor }}>{aScore}</span>
            </span>
          ) : (
            <span className={styles.vsText}>vs</span>
          )}
        </div>
        <div className={`${styles.team} ${styles.teamAway}`}>
          <span className={styles.teamName}>{awayName}</span>
          <div className={styles.teamDot} style={{ background: awayColor }} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.watchBtn}>
          {isLive ? '▶ شاهد الآن' : match.status === 'finished' ? '⟳ إعادة المشاهدة' : '🔔 تذكير'}
        </span>
        {isLive && <span className={styles.liveIndicator}>🔴 Live</span>}
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton_card}>
      <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ height: 20, width: '30%' }} />
        <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 20, width: '30%' }} />
      </div>
      <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
    </div>
  )
}

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState([])
  const [finishedMatches, setFinishedMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Live matches listener
    const liveQ = query(
      collection(db, 'matches'),
      where('status', '==', 'live')
    )
    const unsubLive = onSnapshot(liveQ, snap => {
      setLiveMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    // Finished matches (last 10)
    const finQ = query(
      collection(db, 'matches'),
      where('status', '==', 'finished'),
      limit(10)
    )
    const unsubFin = onSnapshot(finQ, snap => {
      setFinishedMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubLive(); unsubFin() }
  }, [])

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroTag}>
            <span className="live-dot" style={{ display:'inline-block' }} />
            منصة البث الرياضي رقم 1 في مصر
          </div>
          <h1 className={styles.heroTitle}>
            شاهد الكرة الطائرة<br />
            <span className={styles.heroGrad}>مباشرةً وبدقة عالية</span>
          </h1>
          <p className={styles.heroSub}>
            بث مباشر مع نتائج حية فورية — متزامن مع الحكام في الملعب
          </p>
          <div className={styles.heroActions}>
            <Link href="/schedule" className="btn btn-primary btn-lg">
              📅 الجدول الكامل
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              🎬 ابدأ المشاهدة
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}><b>{liveMatches.length}</b><span>مباشر الآن</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><b>{finishedMatches.length}+</b><span>مباراة مسجلة</span></div>
            <div className={styles.statDiv} />
            <div className={styles.stat}><b>HD</b><span>جودة عالية</span></div>
          </div>
        </div>
      </section>

      {/* ── Live Now ── */}
      <section className={styles.sec}>
        <div className="container">
          <div className="sec-hd">
            <h2 className="flex gap-8" style={{ alignItems:'center' }}>
              <span className="live-dot" style={{ display:'inline-block' }} />
              مباشر الآن
            </h2>
            <Link href="/schedule" style={{ fontSize: 13, color: 'var(--teal)' }}>كل المباريات →</Link>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : liveMatches.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📡</div>
              <div className={styles.emptyText}>لا توجد مباريات مباشرة الآن</div>
              <div className={styles.emptySub}>شاهد الجدول لمعرفة المباريات القادمة</div>
              <Link href="/schedule" className="btn btn-primary" style={{ marginTop: 16 }}>
                📅 جدول المباريات
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {liveMatches.map(m => <MatchCard key={m.id} match={m} isLive />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Results ── */}
      {finishedMatches.length > 0 && (
        <section className={styles.sec}>
          <div className="container">
            <div className="sec-hd">
              <h2>🏆 آخر النتائج</h2>
            </div>
            <div className={styles.grid}>
              {finishedMatches.map(m => <MatchCard key={m.id} match={m} isLive={false} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.featTitle}>لماذا XURA Stream؟</h2>
          <div className={styles.featGrid}>
            {[
              { icon: '⚡', title: 'نتائج فورية', desc: 'متزامنة مع حكم المباراة بدون تأخير' },
              { icon: '📺', title: 'بث عالي الجودة', desc: 'حتى 1080p بتأخير أقل من 5 ثوانٍ' },
              { icon: '📱', title: 'على كل الأجهزة', desc: 'موبايل، تابلت، لابتوب — بدون تطبيق' },
              { icon: '🏆', title: 'أرشيف كامل', desc: 'شاهد كل مباريات البطولة في أي وقت' },
            ].map((f, i) => (
              <div key={i} className={styles.featCard}>
                <div className={styles.featIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
