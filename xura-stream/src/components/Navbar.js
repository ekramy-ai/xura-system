'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '/',         label: 'البث المباشر' },
    { href: '/schedule', label: 'الجدول' },
    { href: '/scores',   label: 'النتائج' },
  ]

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandX}>XURA</span>
          <span className={styles.brandTag}>STREAM</span>
        </Link>

        {/* Links */}
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

        {/* Auth */}
        <div className={styles.auth}>
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.avatar}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" width={32} height={32} />
                  : <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                }
              </div>
              <div className={styles.dropdown}>
                <div className={styles.dropName}>{user.displayName || user.email}</div>
                <Link href="/profile" className={styles.dropItem}>حسابي</Link>
                <button className={styles.dropItem} onClick={logout}>تسجيل خروج</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              تسجيل دخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
