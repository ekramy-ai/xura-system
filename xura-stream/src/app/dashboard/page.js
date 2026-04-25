'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ clubs: 0, matches: 0, live: 0, finished: 0 })

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'clubs')), s => setStats(p => ({ ...p, clubs: s.size })))
    const u2 = onSnapshot(query(collection(db, 'matches')), s => {
      const all = s.docs.map(d => d.data())
      setStats(p => ({
        ...p,
        matches: s.size,
        live:     all.filter(m => m.status === 'live').length,
        finished: all.filter(m => m.status === 'finished').length,
      }))
    })
    return () => { u1(); u2() }
  }, [])

  const statCards = [
    { label: 'إجمالي الأندية',    value: stats.clubs,    icon: '🏟️', color: 'var(--teal)',   bg: 'var(--teal-bg)'   },
    { label: 'إجمالي المباريات',  value: stats.matches,  icon: '⚡',  color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
    { label: 'مباشر الآن',        value: stats.live,     icon: '🔴',  color: 'var(--red)',    bg: 'var(--red-bg)'    },
    { label: 'مباريات منتهية',    value: stats.finished, icon: '✅',  color: 'var(--green)',  bg: 'var(--green-bg)'  },
  ]

  const quickLinks = [
    { href: '/dashboard/clubs',   icon: '🏟️', label: 'إدارة الأندية',     desc: 'إضافة وتعديل أندية اللاعبين والفرق' },
    { href: '/dashboard/matches', icon: '⚡',  label: 'إدارة المباريات',   desc: 'عرض وإدارة المباريات الحالية' },
    { href: '/dashboard/users',   icon: '👥',  label: 'إدارة المستخدمين', desc: 'صلاحيات المسؤولين والحكام' },
  ]

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>📊 نظرة عامة</h1>
          <p>مرحباً بك في لوحة تحكم XURA</p>
        </div>
        <Link href="/dashboard/clubs" className="btn btn-primary">+ إضافة نادي</Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⚡ الوصول السريع</h2>
        <div className="grid-3">
          {quickLinks.map(l => (
            <Link key={l.href} href={l.href} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '20px',
              textDecoration: 'none',
              transition: 'var(--tr)',
              display: 'block',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{l.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{l.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{l.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
