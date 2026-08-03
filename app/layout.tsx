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
  title: "Omnix Lab | Premium Web Development & Trading Bot Development Company",
  description: "Omnix Lab is a premium development studio specializing in web development, trading bot development, software engineering, mobile apps, and AI solutions. Founded by Akomolafe Nathaniel. Available worldwide.",
  keywords: [
    "web development",
    "trading bot development",
    "software development",
    "mobile app development",
    "AI solutions",
    "Omnix Lab",
    "Akomolafe Nathaniel",
    "Nigeria developer",
    "crypto trading bot",
    "forex trading bot",
    "Next.js developer",
    "React developer",
    "SaaS development",
    "enterprise software",
    "cloud infrastructure",
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
    title: "Omnix Lab | Premium Web Development & Trading Bot Development",
    description: "Elite software development & digital solutions for forward-thinking businesses worldwide. Web apps, trading bots, SaaS, and AI.",
    url: "https://omnixlabsupport.com",
    siteName: "Omnix Lab",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omnix Lab | Premium Development Studio",
    description: "Elite software development & digital solutions for forward-thinking businesses worldwide.",
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
        <meta name="trustpilot-one-time-domain-verification-id" content="448eaaee-e205-4764-9e8b-87aa185e7448"/>
        <meta name="google-site-verification" content="f2z1UulRNHkkLu7y-Aclth-LoOiGSRzqp9jFca2cCMc" />
        <meta name="msvalidate.01" content="AD5FF21A900C5F4F1767A33F15A832FC" />
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