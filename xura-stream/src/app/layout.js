import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'XURA Stream — بث مباريات الكرة الطائرة',
  description: 'شاهد مباريات الكرة الطائرة مباشرةً مع نتائج حية فورية',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ paddingTop: 'var(--nav-h)' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
