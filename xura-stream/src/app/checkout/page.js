'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import styles from './page.module.css'

function CheckoutContent() {
  const { t } = useLanguage()
  const { purchaseSubscription } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const planId = searchParams.get('plan')
  const tourId = searchParams.get('tourId')
  const price = searchParams.get('price') || '0'
  const name = searchParams.get('name') || ''

  const [method, setMethod] = useState('card')
  const [processing, setProcessing] = useState(false)

  const handlePayment = async (e) => {
    e.preventDefault()
    setProcessing(true)
    
    try {
      await purchaseSubscription(planId, tourId)
      alert(t('checkout.success'))
      router.push('/')
    } catch (err) {
      alert('Payment Failed: ' + err.message)
      setProcessing(false)
    }
  }

  if (!planId) return null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('checkout.title')}</h1>
        <p className={styles.subtitle}>{t('checkout.subtitle')}</p>
      </div>

      <div className={styles.summaryBox}>
        <div className={styles.planName}>{name}</div>
        <div className={styles.price}>{price} EGP</div>
      </div>

      <h3 className={styles.methodTitle}>{t('checkout.method')}</h3>
      <div className={styles.methods}>
        <div className={`${styles.methodBtn} ${method === 'card' ? styles.methodActive : ''}`} onClick={() => setMethod('card')}>
          <span className={styles.methodIcon}>💳</span>
          {t('checkout.card')}
        </div>
        <div className={`${styles.methodBtn} ${method === 'wallet' ? styles.methodActive : ''}`} onClick={() => setMethod('wallet')}>
          <span className={styles.methodIcon}>📱</span>
          {t('checkout.wallet')}
        </div>
        <div className={`${styles.methodBtn} ${method === 'paypal' ? styles.methodActive : ''}`} onClick={() => setMethod('paypal')}>
          <span className={styles.methodIcon}>🅿️</span>
          {t('checkout.paypal')}
        </div>
      </div>

      <form className={styles.form} onSubmit={handlePayment}>
        {method === 'card' && (
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.fullWidth}`}>
              <label>{t('checkout.cardNum')}</label>
              <input type="text" className="form-control" placeholder="0000 0000 0000 0000" required disabled={processing} />
            </div>
            <div className="form-group">
              <label>{t('checkout.expiry')}</label>
              <input type="text" className="form-control" placeholder="MM/YY" required disabled={processing} />
            </div>
            <div className="form-group">
              <label>{t('checkout.cvv')}</label>
              <input type="text" className="form-control" placeholder="123" required disabled={processing} />
            </div>
          </div>
        )}

        {method === 'wallet' && (
          <div className="form-group">
            <label>{t('checkout.phoneNum')}</label>
            <input type="tel" className="form-control" placeholder="01000000000" required disabled={processing} />
            <small style={{ color: 'var(--text3)', marginTop: 8, display: 'block' }}>
              سيصلك إشعار على هاتفك لتأكيد الدفع (محاكاة)
            </small>
          </div>
        )}

        {method === 'paypal' && (
          <div className={styles.paypalBox}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>سيتم توجيهك إلى حساب PayPal الخاص بك لإتمام الدفع (محاكاة)</p>
          </div>
        )}

        <button 
          type="submit" 
          className={`btn btn-primary ${styles.payBtn} ${processing ? styles.processing : ''}`}
          disabled={processing}
        >
          {processing ? t('checkout.processing') : `${t('checkout.payBtn')} - ${price} EGP`}
        </button>
      </form>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="spinner" style={{ margin: '100px auto', width: 40, height: 40 }} />}>
      <CheckoutContent />
    </Suspense>
  )
}
