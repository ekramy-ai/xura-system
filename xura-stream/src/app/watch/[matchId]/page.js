'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import styles from './page.module.css'
import AuthGuard from '@/components/AuthGuard'

/* ── Score Overlay ── */
function ScoreOverlay({ match }) {
  if (!match) return null
  const hName = match.home?.name_ar || 'الفريق الأول'
  const aName = match.away?.name_ar || 'الفريق الثاني'
  const hColor = match.home?.color || '#14b8a6'
  const aColor = match.away?.color || '#3b82f6'
  const hScore = match.currentHomeScore ?? 0
  const aScore = match.currentAwayScore ?? 0
  const setNum = match.currentSetNum || 1

  return (
    <div className={styles.overlay}>
      <div className={styles.ovLeft}>
        <div className={styles.ovDot} style={{ background: hColor }} />
        <span className={styles.ovTeam}>{hName}</span>
        <span className={styles.ovScore} style={{ color: hColor }}>{hScore}</span>
      </div>
      <div className={styles.ovCenter}>
        <span className={styles.ovSet}>ش {setNum}</span>
        <span className={styles.ovSep}>—</span>
        <span className={styles.live}>🔴 LIVE</span>
      </div>
      <div className={styles.ovRight}>
        <span className={styles.ovScore} style={{ color: aColor }}>{aScore}</span>
        <span className={styles.ovTeam}>{aName}</span>
        <div className={styles.ovDot} style={{ background: aColor }} />
      </div>
    </div>
  )
}

/* ── Video Player ── */
function VideoPlayer({ match }) {
  const streamId = match?.stream_youtube_id || match?.youtube_id
  const isLive   = match?.status === 'live'

  if (!streamId) {
    return (
      <div className={styles.noStream}>
        <div className={styles.noStreamIcon}>📡</div>
        <div className={styles.noStreamText}>
          {isLive ? 'البث جاري التحضير...' : 'لا يوجد بث متاح لهذه المباراة حالياً'}
        </div>
        {isLive && <p className={styles.noStreamSub}>يمكنك متابعة النتيجة أدناه بينما ننتظر البث</p>}
      </div>
    )
  }

  const embedUrl = isLive
    ? `https://www.youtube.com/embed/${streamId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`
    : `https://www.youtube.com/embed/${streamId}?controls=1&rel=0`

  return (
    <iframe
      className={styles.iframe}
      src={embedUrl}
      title="XURA Stream"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )
}

/* ── Events Log ── */
function EventsLog({ matchId }) {
  const [events, setEvents] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!matchId) return
    const evQ = query(
      collection(db, 'matches', matchId, 'events'),
      orderBy('recorded_at', 'desc'),
      limit(30)
    )
    return onSnapshot(evQ, snap => {
      const evts = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => !e.undone)
      setEvents(evts)
    })
  }, [matchId])

  const typeIcon = {
    attack: { icon: '▲', color: '#f97316', label: 'هجوم' },
    serve_ace: { icon: '◎', color: '#facc15', label: 'إيس' },
    block: { icon: '■', color: '#38bdf8', label: 'كتلة' },
    opponent_error: { icon: '✕', color: '#f87171', label: 'خطأ خصم' },
    dig: { icon: '↙', color: '#4ade80', label: 'دفاع' },
    point: { icon: '●', color: '#94a3b8', label: 'نقطة' },
  }

  if (!events.length) {
    return (
      <div className={styles.evEmpty}>لا توجد أحداث مسجلة بعد</div>
    )
  }

  return (
    <div className={styles.eventsList}>
      {events.map(e => {
        const meta = typeIcon[e.point_type] || typeIcon.point
        const side = e.scoring_side === 'home' ? 'home' : 'away'
        return (
          <div key={e.id} className={`${styles.eventItem} ${styles[side]}`}>
            <span className={styles.evIcon} style={{ color: meta.color }}>{meta.icon}</span>
            <div className={styles.evBody}>
              <span className={styles.evLabel}>{meta.label}</span>
              <span className={styles.evScore}>{e.home_score_after}–{e.away_score_after}</span>
            </div>
            <span className={styles.evSet}>ش{e.set_num}</span>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

/* ── Set Scores ── */
function SetScores({ match }) {
  const sets = match?.setScores?.filter(s => s.status !== 'pending') || []
  if (!sets.length) return null
  const hName = match?.home?.name_ar || 'الفريق الأول'
  const aName = match?.away?.name_ar || 'الفريق الثاني'
  return (
    <div className={styles.setsTable}>
      <div className={styles.setsHeader}>
        <span>الشوط</span>
        <span>{hName}</span>
        <span>{aName}</span>
      </div>
      {sets.map(s => (
        <div key={s.num} className={`${styles.setsRow} ${s.status === 'active' ? styles.setsActive : ''}`}>
          <span>ش{s.num}</span>
          <span className={styles.setsScore}>{s.home}</span>
          <span className={styles.setsScore}>{s.away}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main Page ── */
export default function WatchPage() {
  const { matchId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [match, setMatch] = useState(null)
  const [matchLoading, setMatchLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    return onSnapshot(doc(db, 'matches', matchId), snap => {
      if (snap.exists()) setMatch({ id: snap.id, ...snap.data() })
      setMatchLoading(false)
    })
  }, [matchId])

  const isLive     = match?.status === 'live'
  const isFinished = match?.status === 'finished'
  const hName = match?.home?.name_ar || 'الفريق الأول'
  const aName = match?.away?.name_ar || 'الفريق الثاني'

  if (matchLoading) {
    return (
      <div className={styles.loadPage}>
        <div className={styles.spinner} />
        <span>جاري تحميل المباراة...</span>
      </div>
    )
  }

  if (!match) {
    return (
      <div className={styles.notFound}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏐</div>
        <h2>المباراة غير موجودة</h2>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }}>الرئيسية</Link>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className={styles.page}>
        <div className={styles.watchLayout}>

          {/* ── Main Column ── */}
          <div className={styles.mainCol}>

            {/* Video + Overlay */}
            <div className={styles.playerWrap}>
              <VideoPlayer match={match} />
              {isLive && <ScoreOverlay match={match} />}
            </div>

            {/* Match Title */}
            <div className={styles.matchInfo}>
              <div className={styles.matchStatus}>
                {isLive && <span className="live-badge"><span className="live-dot" />مباشر</span>}
                {isFinished && <span className={styles.finBadge}>✓ انتهت</span>}
                <span className={styles.tournament}>{match.tournament || 'بطولة XURA'}</span>
              </div>
              <h1 className={styles.matchTitle}>{hName} vs {aName}</h1>
              <div className={styles.matchMeta}>
                {match.gender && <span>{match.gender}</span>}
                {match.ageGroup && <span>{match.ageGroup}</span>}
              </div>
            </div>

            {/* Set Scores table */}
            <div className={styles.setsSection}>
              <h3 className={styles.sideTitle}>نتائج الأشواط</h3>
              <SetScores match={match} />
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className={styles.sidebar}>

            {/* Live Score Box */}
            <div className={styles.scoreBox}>
              <div className={styles.scoreBoxTitle}>
                {isLive && <><span className="live-dot" style={{display:'inline-block'}} /> النتيجة الحية</>}
                {isFinished && '✓ النتيجة النهائية'}
                {!isLive && !isFinished && '⏳ قادمة'}
              </div>
              <div className={styles.scoreBoxTeams}>
                <div className={styles.sbTeam}>
                  <div className={styles.sbDot} style={{ background: match.home?.color || '#14b8a6' }} />
                  <span>{hName}</span>
                </div>
                <div className={styles.sbScores}>
                  <span className={styles.sbPts} style={{ color: match.home?.color || '#14b8a6' }}>
                    {match.currentHomeScore ?? match.homeSets ?? 0}
                  </span>
                  <span className={styles.sbDash}>—</span>
                  <span className={styles.sbPts} style={{ color: match.away?.color || '#3b82f6' }}>
                    {match.currentAwayScore ?? match.awaySets ?? 0}
                  </span>
                </div>
                <div className={`${styles.sbTeam} ${styles.sbTeamAway}`}>
                  <span>{aName}</span>
                  <div className={styles.sbDot} style={{ background: match.away?.color || '#3b82f6' }} />
                </div>
              </div>
              {isLive && (
                <div className={styles.sbSets}>
                  <div className={styles.sbSetsLabel}>الأشواط المكتملة</div>
                  <div className={styles.sbSetsScore}>
                    <span style={{ color: match.home?.color || '#14b8a6' }}>{match.setsWon?.home ?? match.homeSets ?? 0}</span>
                    <span>–</span>
                    <span style={{ color: match.away?.color || '#3b82f6' }}>{match.setsWon?.away ?? match.awaySets ?? 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Events Log */}
            <div className={styles.eventsBox}>
              <h3 className={styles.sideTitle}>⚡ سجل النقاط</h3>
              <EventsLog matchId={matchId} />
            </div>

            {/* Back link */}
            <Link href="/" className={`btn btn-ghost ${styles.backBtn}`}>
              ← الرئيسية
            </Link>
          </div>

        </div>
      </div>
    </AuthGuard>
  )
}
