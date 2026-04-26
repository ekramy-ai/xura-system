'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import styles from './page.module.css'

export default function SubscribePage() {
  const { t } = useLanguage()
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const snap = await getDocs(collection(db, 'tournaments'))
        setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchTournaments()
  }, [])

  const handleSubscribe = (planId, tourId = null, price = 0, name = '') => {
    if (!user) {
      router.push('/login?redirect=/subscribe')
      return
    }
    
    const queryParams = new URLSearchParams({
      plan: planId,
      price,
      name
    })
    if (tourId) queryParams.append('tourId', tourId)
      
    router.push(`/checkout?${queryParams.toString()}`)
  }

  const currentPlan = profile?.subscription?.plan || 'free'
  const unlockedTours = profile?.subscription?.unlockedTournaments || []

  if (authLoading || loading) {
    return <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><div className="spinner" style={{width: 40, height: 40}} /></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('subscribe.title')}</h1>
        <p className={styles.subtitle}>{t('subscribe.subtitle')}</p>
      </div>

      <div className={styles.grid}>
        {/* Free Plan */}
        <div className={styles.card}>
          <div className={styles.planName}>{t('subscribe.free')}</div>
          <div className={styles.price}>0 <span className={styles.currency}>EGP</span></div>
          <p className={styles.desc}>{t('subscribe.freeDesc')}</p>
          <button className={`btn ${styles.btn} ${currentPlan === 'free' ? 'btn-outline' : 'btn-ghost'}`} disabled={currentPlan === 'free'}>
            {currentPlan === 'free' ? t('subscribe.currentPlan') : t('subscribe.free')}
          </button>
        </div>

        {/* Monthly Premium */}
        <div className={`${styles.card} ${styles.popular}`}>
          <div className={styles.badge}>الأكثر شعبية</div>
          <div className={styles.planName}>{t('subscribe.monthly')}</div>
          <div className={styles.price}>100 <span className={styles.currency}>EGP / mo</span></div>
          <p className={styles.desc}>{t('subscribe.monthlyDesc')}</p>
          <button 
            className={`btn ${styles.btn} ${currentPlan === 'premium' ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => handleSubscribe('monthly', null, 100, t('subscribe.monthly'))}
            disabled={currentPlan === 'premium'}
          >
            {currentPlan === 'premium' ? t('subscribe.currentPlan') : t('subscribe.subscribeBtn')}
          </button>
        </div>

        {/* Yearly Premium */}
        <div className={styles.card}>
          <div className={styles.planName}>{t('subscribe.yearly')}</div>
          <div className={styles.price}>1000 <span className={styles.currency}>EGP / yr</span></div>
          <p className={styles.desc}>{t('subscribe.yearlyDesc')}</p>
          <button 
            className={`btn ${styles.btn} ${currentPlan === 'premium' ? 'btn-outline' : 'btn-ghost'}`}
            onClick={() => handleSubscribe('yearly', null, 1000, t('subscribe.yearly'))}
            disabled={currentPlan === 'premium'}
          >
            {currentPlan === 'premium' ? t('subscribe.currentPlan') : t('subscribe.subscribeBtn')}
          </button>
        </div>
      </div>

      {/* Tournament Passes */}
      {tournaments.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 className={styles.sectionTitle}>{t('subscribe.tourPass')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tournaments.map(tour => {
              const isUnlocked = currentPlan === 'premium' || unlockedTours.includes(tour.id)
              return (
                <div key={tour.id} className={styles.tourCard}>
                  <div className={styles.tourInfo}>
                    <h3>🏆 {tour.name}</h3>
                    <p>{t('subscribe.tourPassDesc')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className={styles.price} style={{ fontSize: 24, margin: 0 }}>
                      40 <span className={styles.currency}>EGP</span>
                    </div>
                    <button 
                      className={`btn ${isUnlocked ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleSubscribe('tourPass', tour.id, 40, `${t('subscribe.tourPass')} ${tour.name}`)}
                      disabled={isUnlocked}
                    >
                      {isUnlocked ? 'مفتوحة لك' : t('subscribe.subscribeBtn')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
