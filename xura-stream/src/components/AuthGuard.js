'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', background: 'var(--bg)' }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
    </div>
  )

  if (!user) return null

  return children
}
