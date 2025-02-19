import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import CacheManager from '@/components/CacheManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '계시록 음악',
  description: '계시록을 음악으로 듣다',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <CacheManager />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
