'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

export default function MatchControlPage() {
  const { matchId } = useParams()
  const router = useRouter()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!matchId) return
    const unsub = onSnapshot(doc(db, 'matches', matchId), snap => {
      if (snap.exists()) {
        setMatch({ id: snap.id, ...snap.data() })
      }
      setLoading(false)
    })
    return unsub
  }, [matchId])

  const updateScore = async (side, diff) => {
    if (!match || saving) return
    setSaving(true)
    try {
      const field = side === 'home' ? 'currentHomeScore' : 'currentAwayScore'
      const current = match[field] || 0
      const newVal = Math.max(0, current + diff)
      
      await updateDoc(doc(db, 'matches', matchId), {
        [field]: newVal,
        updatedAt: serverTimestamp()
      })

      // Record event if point added
      if (diff > 0) {
        await addDoc(collection(db, 'matches', matchId, 'events'), {
          type: 'point',
          scoring_side: side,
          point_type: 'point',
          home_score_after: side === 'home' ? newVal : (match.currentHomeScore || 0),
          away_score_after: side === 'away' ? newVal : (match.currentAwayScore || 0),
          recorded_at: serverTimestamp(),
          set_num: match.currentSetNum || 1
        })
      }
    } catch (e) {
      alert('خطأ في التحديث: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status) => {
    if (!confirm(`تحويل حالة المباراة إلى ${status}؟`)) return
    await updateDoc(doc(db, 'matches', matchId), { status })
  }

  const recordSkill = async (side, type) => {
    if (!match || saving) return
    setSaving(true)
    try {
      const field = side === 'home' ? 'currentHomeScore' : 'currentAwayScore'
      const newVal = (match[field] || 0) + 1
      
      await updateDoc(doc(db, 'matches', matchId), {
        [field]: newVal,
        updatedAt: serverTimestamp()
      })

      await addDoc(collection(db, 'matches', matchId, 'events'), {
        type: 'skill',
        scoring_side: side,
        point_type: type,
        home_score_after: side === 'home' ? newVal : (match.currentHomeScore || 0),
        away_score_after: side === 'away' ? newVal : (match.currentAwayScore || 0),
        recorded_at: serverTimestamp(),
        set_num: match.currentSetNum || 1
      })
    } catch (e) {
      alert('خطأ: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.loading}>جاري التحميل...</div>
  if (!match) return <div className={styles.error}>المباراة غير موجودة</div>

  const hName = match.home?.name_ar || 'الفريق الأول'
  const aName = match.away?.name_ar || 'الفريق الثاني'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/matches" className={styles.back}>← العودة</Link>
        <div className={styles.title}>لوحة تحكم الحكم</div>
        <div className={styles.status}>
          <span className={`${styles.badge} ${match.status === 'live' ? styles.live : ''}`}>
            {match.status === 'live' ? '🔴 مباشر' : '⏳ قادمة'}
          </span>
        </div>
      </div>

      <div className={styles.matchMeta}>
        <h2>{match.tournament || 'بطولة XURA'}</h2>
        <div className={styles.teamsHeader}>
          <span>{hName}</span>
          <span className={styles.vs}>vs</span>
          <span>{aName}</span>
        </div>
      </div>

      {/* Main Score Area */}
      <div className={styles.scoreGrid}>
        <div className={styles.teamControl}>
          <div className={styles.teamName} style={{ color: match.home?.color }}>{hName}</div>
          <div className={styles.bigScore}>{match.currentHomeScore || 0}</div>
          <div className={styles.mainBtns}>
            <button className={styles.plusBtn} onClick={() => updateScore('home', 1)} disabled={saving}>+1</button>
            <button className={styles.minusBtn} onClick={() => updateScore('home', -1)} disabled={saving}>-1</button>
          </div>
          <div className={styles.skillGrid}>
            <button onClick={() => recordSkill('home', 'attack')}>هجوم ▲</button>
            <button onClick={() => recordSkill('home', 'block')}>حائط ■</button>
            <button onClick={() => recordSkill('home', 'serve_ace')}>إيس ◎</button>
          </div>
        </div>

        <div className={styles.scoreDivider}>:</div>

        <div className={styles.teamControl}>
          <div className={styles.teamName} style={{ color: match.away?.color }}>{aName}</div>
          <div className={styles.bigScore}>{match.currentAwayScore || 0}</div>
          <div className={styles.mainBtns}>
            <button className={styles.plusBtn} onClick={() => updateScore('away', 1)} disabled={saving}>+1</button>
            <button className={styles.minusBtn} onClick={() => updateScore('away', -1)} disabled={saving}>-1</button>
          </div>
          <div className={styles.skillGrid}>
            <button onClick={() => recordSkill('away', 'attack')}>هجوم ▲</button>
            <button onClick={() => recordSkill('away', 'block')}>حائط ■</button>
            <button onClick={() => recordSkill('away', 'serve_ace')}>إيس ◎</button>
          </div>
        </div>
      </div>

      {/* Match Actions */}
      <div className={styles.actions}>
        <h3>إدارة المباراة</h3>
        <div className={styles.actionBtns}>
          {match.status !== 'live' && (
            <button className={styles.startBtn} onClick={() => changeStatus('live')}>بث مباشر الآن 🔴</button>
          )}
          {match.status === 'live' && (
            <button className={styles.finishBtn} onClick={() => changeStatus('finished')}>إنهاء المباراة ✓</button>
          )}
          <button className={styles.resetBtn} onClick={async () => {
             if(confirm('تصفير النتيجة؟')) {
               await updateDoc(doc(db, 'matches', matchId), {
                 currentHomeScore: 0,
                 currentAwayScore: 0,
                 setsWon: { home: 0, away: 0 }
               })
             }
          }}>تصفير النتيجة ⟳</button>
        </div>
      </div>
    </div>
  )
}
