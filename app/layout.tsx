import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ConditionalLayout from '@/components/ConditionalLayout'
import Preloader from '@/components/Preloader'
import ScrollProgress from '@/components/ScrollProgress'
import BackToTop from '@/components/BackToTop'
import WhatsAppBubble from '@/components/WhatsAppBubble'
import CursorGlow from '@/components/CursorGlow'
import VisitorTracker from '@/components/VisitorTracker'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Omnix Lab | Global Software Development & Trading Bot Company',
  description:
    'Omnix Lab is a global software development company. We build trading bots, web apps, SaaS platforms, mobile apps, and AI solutions for businesses worldwide. 50+ projects, 99% satisfaction. Founded by Akomolafe Nathaniel.',
  authors: [{ name: 'Akomolafe Nathaniel' }],
  keywords: [
    'software development company',
    'trading bot development',
    'web development services',
    'custom software development',
    'SaaS development company',
    'mobile app development',
    'AI solutions for business',
    'hire software developers',
    'enterprise software development',
    'crypto trading bot developer',
    'forex trading bot',
    'automated trading systems',
    'Next.js development',
    'React development services',
    'cloud infrastructure services',
    'Omnix Lab',
    'Akomolafe Nathaniel',
  ],
  creator: 'Omnix Lab',
  publisher: 'Omnix Lab',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Omnix Lab | Global Software Development & Trading Bot Company',
    description:
      'Omnix Lab builds trading bots, web apps, SaaS, and AI solutions for businesses worldwide. 50+ projects delivered, 99% client satisfaction.',
    url: 'https://omnixlab-production.up.railway.app',
    siteName: 'Omnix Lab',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omnix Lab | Global Software Development Company',
    description: 'Trading bots, web apps, SaaS, AI. Trusted by businesses worldwide.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'mvuvpEIjBg35Cq2CAAWC_SJyaT-Z0ixQPcF35UJ5dWk',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="google-site-verification" content="mvuvpEIjBg35Cq2CAAWC_SJyaT-Z0ixQPcF35UJ5dWk" />
        <meta name="google-site-verification" content="f2z1UulRNHkkLu7y-Aclth-LoOiGSRzqp9jFca2cCMc" />
        <meta name="msvalidate.01" content="AD5FF21A900C5F4F1767A33F15A832FC" />
        <meta name="trustpilot-one-time-domain-verification-id" content="448eaaee-e205-4764-9e8b-87aa185e7448" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConditionalLayout>
          <Preloader />
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <BackToTop />
          <WhatsAppBubble />
          <CursorGlow />
          <VisitorTracker />

          {/* Small Google Translate Widget */}
          <div
            id="google_translate_element"
            className="fixed bottom-4 left-4 z-40 google-translate-small"
          ></div>

          {/* Google Translate Script */}
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                function googleTranslateElementInit() {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,fr,es,de,zh-CN,ar,pt,ja,ko,ru,hi',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                  }, 'google_translate_element');
                }
              `,
            }}
          />
          <script
            type="text/javascript"
            src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            async
          />
        </ConditionalLayout>
      </body>
    </html>
  )
}