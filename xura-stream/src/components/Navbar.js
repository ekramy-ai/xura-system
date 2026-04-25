'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const pathname = usePathname()
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [userDrop,  setUserDrop]  = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setUserDrop(false) }, [pathname])

  const links = [
    { href: '/',          label: 'البث المباشر', icon: '📡' },
    { href: '/schedule',  label: 'الجدول',       icon: '📅' },
    { href: '/clubs',     label: 'الأندية',       icon: '🏟️' },
    { href: '/standings', label: 'الترتيب',      icon: '🏆' },
  ]

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>

          {/* Brand */}
          <Link href="/" className={styles.brand}>
            <span className={styles.brandX}>XURA</span>
            <span className={styles.brandTag}>STREAM</span>
          </Link>

          {/* Desktop Links */}
          <div className={styles.links}>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className={styles.right}>
            {user ? (
              <div className={styles.userMenu} ref={dropRef}>
                <button
                  className={styles.avatar}
                  onClick={() => setUserDrop(v => !v)}
                  aria-label="القائمة"
                >
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" width={32} height={32} />
                    : <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                  }
                  {isAdmin && <span className={styles.adminDot} title="مسؤول" />}
                </button>
                {userDrop && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropName}>{user.displayName || user.email}</div>
                    {isAdmin && (
                      <Link href="/dashboard" className={`${styles.dropItem} ${styles.dropAdmin}`}>
                        ⚙️ لوحة الإدارة
                      </Link>
                    )}
                    <Link href="/profile" className={styles.dropItem}>👤 حسابي</Link>
                    <div className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={logout}>
                      🚪 تسجيل خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                تسجيل دخول
              </Link>
            )}

            {/* Hamburger */}
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="القائمة"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.brandX}>XURA</span>
              <span className={styles.brandTag} style={{ marginRight: 4 }}>STREAM</span>
              <button className={styles.drawerClose} onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <div className={styles.drawerLinks}>
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`${styles.drawerLink} ${pathname === l.href ? styles.drawerActive : ''}`}
                >
                  <span className={styles.drawerIcon}>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className={styles.drawerUser}>
                <div className={styles.drawerUserInfo}>
                  <div className={styles.drawerAvatar}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" width={40} height={40} style={{ borderRadius: '50%' }} />
                      : (user.displayName || user.email || 'U')[0].toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.displayName || 'مستخدم'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user.email}</div>
                  </div>
                </div>
                {isAdmin && (
                  <Link href="/dashboard" className={`${styles.drawerLink} ${styles.drawerAdmin}`}>
                    <span className={styles.drawerIcon}>⚙️</span> لوحة الإدارة
                  </Link>
                )}
                <Link href="/profile" className={styles.drawerLink}>
                  <span className={styles.drawerIcon}>👤</span> حسابي
                </Link>
                <button className={`${styles.drawerLink} ${styles.drawerLogout}`} onClick={logout}>
                  <span className={styles.drawerIcon}>🚪</span> تسجيل خروج
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 20px' }}>
                <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  تسجيل دخول
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
