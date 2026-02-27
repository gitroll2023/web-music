import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/chapter.css'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import CacheManager from '@/components/CacheManager'
import StatusBar from '@/components/StatusBar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Providers from '@/components/Providers'
import { validateEnv } from '@/lib/envCheck'

// Validate environment variables on server startup
validateEnv()

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NAJU INFO',
  description: 'NAJU INFO - Music & Culture Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className}`}>
        <CacheManager />
        <StatusBar />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
