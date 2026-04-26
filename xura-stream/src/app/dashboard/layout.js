'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import styles from './layout.module.css'

const NAV = [
  { href: '/dashboard',          icon: '📊', label: 'نظرة عامة' },
  { href: '/dashboard/clubs',    icon: '🏟️', label: 'الأندية' },
  { href: '/dashboard/matches',  icon: '⚡', label: 'المباريات' },
  { href: '/dashboard/users',    icon: '👥', label: 'المستخدمون', adminOnly: true },
]

const REF_NAV = [
  { href: '/dashboard/matches',  icon: '⚡', label: 'إدارة المباريات' },
]

export default function DashboardLayout({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && !isAdmin && !isReferee) {
      router.push('/admin-setup')
    }
  }, [user, isAdmin, isReferee, loading, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div style={{ color: 'var(--text3)', fontSize: 14 }}>جاري التحقق من الصلاحيات...</div>
      </div>
    )
  }

  if (!isAdmin && !isReferee) return null

  const sidebarLinks = isAdmin ? NAV : REF_NAV

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandX}>XURA</span>
            <span className={styles.brandTag}>ADMIN</span>
          </div>
          <div className={styles.adminBadge}>⚙️ لوحة التحكم</div>
        </div>

        <nav className={styles.sideNav}>
          {sidebarLinks.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sideLink} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.sideIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <Link href="/" className={styles.sideLink} style={{ opacity: .7 }}>
            <span className={styles.sideIcon}>🌐</span>
            الموقع الرئيسي
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  )
}
