'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ar') // Default is Arabic

  useEffect(() => {
    // Load saved language on mount
    const saved = localStorage.getItem('xura_lang')
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLang(saved)
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar'
    setLang(newLang)
    localStorage.setItem('xura_lang', newLang)
    document.documentElement.lang = newLang
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  // Translation helper
  const t = (key) => {
    return translations[lang]?.[key] || translations['ar']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
