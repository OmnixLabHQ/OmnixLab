import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
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
  title: "Omnix Lab | Global Software Development & Trading Bot Company",
  description:
    "Omnix Lab is a global software development company. We build trading bots, web apps, SaaS platforms, mobile apps, and AI solutions for businesses worldwide. 50+ projects, 99% satisfaction. Founded by Akomolafe Nathaniel.",
  keywords: [
    "software development company",
    "trading bot development",
    "web development services",
    "custom software development",
    "SaaS development company",
    "mobile app development",
    "AI solutions for business",
    "hire software developers",
    "enterprise software development",
    "crypto trading bot developer",
    "forex trading bot",
    "automated trading systems",
    "Next.js development",
    "React development services",
    "cloud infrastructure services",
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
    title: "Omnix Lab | Global Software Development & Trading Bot Company",
    description:
      "Omnix Lab builds trading bots, web apps, SaaS, and AI solutions for businesses worldwide. 50+ projects delivered, 99% client satisfaction.",
    url: "https://omnixlabsupport.com",
    siteName: "Omnix Lab",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omnix Lab | Global Software Development Company",
    description:
      "Trading bots, web apps, SaaS, AI. Trusted by businesses worldwide.",
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
        <meta
          name="google-site-verification"
          content="mvuvpEIjBg35Cq2CAAWC_SJyaT-Z0ixQPcF35UJ5dWk"
        />
        <meta
          name="google-site-verification"
          content="f2z1UulRNHkkLu7y-Aclth-LoOiGSRzqp9jFca2cCMc"
        />
        <meta name="msvalidate.01" content="AD5FF21A900C5F4F1767A33F15A832FC" />
        <meta
          name="trustpilot-one-time-domain-verification-id"
          content="448eaaee-e205-4764-9e8b-87aa185e7448"
        />

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Q7BZ825DS6"
        ></script>
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
              name: "Omnix Lab",
              url: "https://omnixlabsupport.com",
              description:
                "Global software development company building trading bots, web applications, SaaS platforms, and AI solutions for businesses worldwide.",
              foundingDate: "2022",
              founder: {
                "@type": "Person",
                name: "Akomolafe Nathaniel",
                jobTitle: "Founder & CEO",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+2347033702874",
                email: "helloafrica@omnixlabsupport.com",
                contactType: "customer service",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "41",
                bestRating: "5",
              },
              areaServed: "Worldwide",
            }),
          }}
        />

        {/* Tawk.to Live Chat */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/6a79d6b5f2dd231d4b746512/1jvlutgf2';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />

        {/* Google Translate */}
        <script type="text/javascript">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,fr,es,de,zh-CN,ar,pt,ja,ko,ru,hi',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </script>
        <script
          type="text/javascript"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        ></script>

        {/* Calendly widget */}
        <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Preloader />
        <ScrollProgress />
        <VisitorTracker />
        <ConditionalLayout>{children}</ConditionalLayout>
        <BackToTop />
        <div
          id="google_translate_element"
          className="fixed bottom-20 left-4 z-50"
        ></div>
      </body>
    </html>
  );
}