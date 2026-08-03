import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisitorTracker from "@/components/VisitorTracker";
import ScrollProgress from "@/components/ScrollProgress";
import BackToTop from "@/components/BackToTop";
import Preloader from "@/components/Preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omnix Lab | Trading Bot & Web Development Company Nigeria",
  description: "Nigeria's most trusted trading bot and web development company. Crypto bots, forex bots, SaaS, AI solutions. 50+ projects delivered. Founded by Akomolafe Nathaniel.",
  keywords: [
    "trading bot development company Nigeria",
    "web development company Nigeria",
    "software development company Nigeria",
    "crypto trading bot developer",
    "forex trading bot development",
    "custom software development services",
    "AI development company Nigeria",
    "SaaS development company",
    "mobile app development Nigeria",
    "hire software developer Nigeria",
    "Omnix Lab",
    "Akomolafe Nathaniel",
  ],
  authors: [{ name: "Akomolafe Nathaniel" }],
  creator: "Omnix Lab",
  publisher: "Omnix Lab",
  metadataBase: new URL("https://omnixlabsupport.com"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Omnix Lab | Trading Bot & Web Development Nigeria",
    description: "Nigeria's most trusted trading bot and web development company. Crypto bots, forex bots, SaaS, AI. 50+ projects.",
    url: "https://omnixlabsupport.com",
    siteName: "Omnix Lab",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omnix Lab | Trading Bot & Web Development Nigeria",
    description: "Nigeria's most trusted software development company. Trading bots, web apps, SaaS, AI.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%234F46E5'/><text x='50' y='68' text-anchor='middle' fill='white' font-size='50' font-weight='bold'>O</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://omnixlabsupport.com" />
        <meta name="google-site-verification" content="mvuvpEIjBg35Cq2CAAWC_SJyaT-Z0ixQPcF35UJ5dWk" />
        <meta name="google-site-verification" content="f2z1UulRNHkkLu7y-Aclth-LoOiGSRzqp9jFca2cCMc" />
        <meta name="msvalidate.01" content="AD5FF21A900C5F4F1767A33F15A832FC" />
        <meta name="trustpilot-one-time-domain-verification-id" content="448eaaee-e205-4764-9e8b-87aa185e7448"/>
        
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q7BZ825DS6"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Q7BZ825DS6');
            `,
          }}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Omnix Lab",
              "url": "https://omnixlabsupport.com",
              "description": "Nigeria's most trusted trading bot development and web development company.",
              "foundingDate": "2022",
              "founder": {
                "@type": "Person",
                "name": "Akomolafe Nathaniel",
                "jobTitle": "Founder & CEO"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+2347033702874",
                "email": "helloafrica@omnixlabsupport.com",
                "contactType": "customer service"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "30",
                "bestRating": "5"
              },
              "areaServed": "Worldwide"
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Preloader />
        <ScrollProgress />
        <VisitorTracker />
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <BackToTop />
        <Footer />
      </body>
    </html>
  );
}