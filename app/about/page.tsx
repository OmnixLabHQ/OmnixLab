import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Omnix Lab | Founder Akomolafe Nathaniel | Nigeria Software Company',
  description: 'Omnix Lab is Nigeria\'s most trusted software development company, founded by Akomolafe Nathaniel. We build trading bots, web apps, SaaS, AI solutions for clients worldwide. 50+ projects, 99% satisfaction.',
  keywords: [
    'Omnix Lab',
    'Akomolafe Nathaniel',
    'Nigeria software company',
    'founder Omnix Lab',
    'CEO Omnix Lab',
    'trading bot developer Nigeria',
    'web development company Nigeria',
    'software development Nigeria',
  ],
  openGraph: {
    title: 'Omnix Lab | Founded by Akomolafe Nathaniel | Nigeria Software Company',
    description: 'Nigeria\'s most trusted software development company. Trading bots, web apps, SaaS, AI. 50+ projects delivered.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <>
      {/* Schema Markup for Google Knowledge Panel */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Omnix Lab",
            "description": "Nigeria's most trusted software development company founded by Akomolafe Nathaniel. Building trading bots, web applications, SaaS platforms, and AI solutions for businesses worldwide.",
            "url": "https://omnixlab-production.up.railway.app",
            "logo": "https://omnixlab-production.up.railway.app/images/akomolafe-nathaniel.jpg",
            "foundingDate": "2022",
            "founder": {
              "@type": "Person",
              "name": "Akomolafe Nathaniel",
              "jobTitle": "Founder & CEO",
              "description": "Akomolafe Nathaniel is the Founder and CEO of Omnix Lab, Nigeria's most trusted software development company. Expert in trading bot development, web development, and enterprise software engineering.",
              "url": "https://omnixlab-production.up.railway.app/about",
              "sameAs": [
                "https://linkedin.com/in/akomolafe-nathaniel",
                "https://github.com/TheTradingPulse"
              ]
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+2347033702874",
              "email": "Akomolafenathaniel123@gmail.com",
              "contactType": "customer service",
              "availableLanguage": ["English"]
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Lagos",
              "addressCountry": "Nigeria"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5.0",
              "reviewCount": "30",
              "bestRating": "5"
            },
            "numberOfEmployees": "10",
            "areaServed": "Worldwide",
            "knowsAbout": [
              "Web Development",
              "Trading Bot Development",
              "Software Engineering",
              "SaaS Development",
              "AI Solutions",
              "Mobile App Development"
            ]
          })
        }}
      />

      <div className="bg-white">
        
        {/* ========== FOUNDER HERO ========== */}
        <section className="relative pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-indigo-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* Photo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                  {/* Replace with your actual photo */}
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-7xl font-bold">AN</span>
                  </div>
                  {/* If using real photo: */}
                  {/* <Image 
                    src="https://ibb.co/zvDrYHj" 
                    alt="Akomolafe Nathaniel - Founder & CEO of Omnix Lab"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    priority
                  /> */}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 shadow-lg border border-gray-100">
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Available for Projects
                  </span>
                </div>
              </div>

              {/* Info */}
              <div>
                <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Founder & CEO</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                  Akomolafe <span className="text-indigo-600">Nathaniel</span>
                </h1>
                <p className="text-xl text-gray-500 mb-4">
                  Building Nigeria&apos;s #1 Most Trusted Software Development Company
                </p>
                <p className="text-gray-600 leading-relaxed max-w-2xl mb-6">
                  Akomolafe Nathaniel is the visionary Founder and CEO of <strong>Omnix Lab</strong>, 
                  Nigeria&apos;s most trusted software development company. With over 4 years of expertise 
                  in software engineering, he has personally led the delivery of <strong>50+ successful projects</strong> 
                  for clients across 10+ countries, earning a <strong>99% client satisfaction rate</strong>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/contact" className="inline-flex px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Work With Me →
                  </Link>
                  <a href="https://wa.me/2347033702874" target="_blank" className="inline-flex px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-indigo-300 transition-colors">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== STATS BAR ========== */}
        <section className="py-10 px-6 lg:px-8 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { number: '50+', label: 'Projects Delivered' },
                { number: '15+', label: 'Global Clients' },
                { number: '99%', label: 'Satisfaction Rate' },
                { number: '4+', label: 'Years Excellence' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-bold text-white">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== ABOUT OMNIX LAB ========== */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Our Story</p>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                About <span className="text-indigo-600">Omnix Lab</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nigeria&apos;s Most Trusted Software Company</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Omnix Lab was founded with a singular mission: to provide world-class software development 
                  services that rival any Silicon Valley agency, right from Nigeria. Under the leadership of 
                  Akomolafe Nathaniel, we have grown from a solo development studio to a full-service software 
                  company serving clients across Africa, Europe, North America, and Asia.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We specialize in <strong>trading bot development</strong>, <strong>enterprise web applications</strong>, 
                  <strong>SaaS platforms</strong>, <strong>mobile applications</strong>, and <strong>AI solutions</strong>. 
                  Every project is built with enterprise-grade architecture, clean code, and a focus on 
                  measurable business results.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  With a <strong>99% client satisfaction rate</strong> and <strong>50+ projects delivered</strong>, 
                  Omnix Lab has established itself as the go-to development partner for businesses seeking 
                  premium digital solutions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎯', title: 'Our Mission', desc: 'Empower businesses worldwide with cutting-edge technology solutions that drive measurable growth.' },
                  { icon: '🔮', title: 'Our Vision', desc: 'Become the #1 software development company in Africa, recognized globally for technical excellence.' },
                  { icon: '💎', title: 'Our Values', desc: 'Quality, transparency, innovation, and client success above everything else.' },
                  { icon: '🌍', title: 'Our Reach', desc: 'Serving clients in 10+ countries with remote-first collaboration and 24/7 support.' },
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-50 to-indigo-50 p-5 rounded-2xl border border-gray-100">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">{item.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== WHY CHOOSE US ========== */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Why Omnix Lab</p>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Why Companies Choose <span className="text-indigo-600">Us</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Founder-Led Excellence', desc: 'Every project receives personal attention from our Founder & CEO, Akomolafe Nathaniel. No project is delegated to junior developers without senior oversight.' },
                { title: 'Enterprise-Grade Quality', desc: 'We use battle-tested technologies and follow rigorous testing protocols. Our code is clean, documented, and built to scale to millions of users.' },
                { title: '100% Transparency', desc: 'Weekly progress updates, direct communication channels, and access to project management tools. You always know exactly where your project stands.' },
                { title: 'On-Time Delivery', desc: 'We commit to realistic timelines and deliver on schedule. 50+ projects completed without a single missed deadline.' },
                { title: 'Post-Launch Support', desc: '30 days of free support after launch. Extended maintenance packages available for ongoing optimization and updates.' },
                { title: 'Global Standards', desc: 'GDPR-ready, HIPAA-compliant, and built to international standards. Our solutions work seamlessly across all regions.' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    <span className="text-indigo-600 font-bold text-lg">{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== INDUSTRIES SERVED ========== */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Industries</p>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                All Sectors <span className="text-indigo-600">Covered</span>
              </h2>
              <p className="text-lg text-gray-500">Building solutions for every industry</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: '🏦', name: 'FinTech' },
                { icon: '🏥', name: 'Healthcare' },
                { icon: '🛒', name: 'E-Commerce' },
                { icon: '📚', name: 'Education' },
                { icon: '🚚', name: 'Logistics' },
                { icon: '🎮', name: 'Gaming' },
                { icon: '🌾', name: 'Agriculture' },
                { icon: '🏠', name: 'Real Estate' },
                { icon: '📱', name: 'Telecom' },
                { icon: '🎬', name: 'Media' },
                { icon: '🛡️', name: 'Security' },
                { icon: '💊', name: 'Pharma' },
              ].map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 text-center border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-default">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CTA ========== */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Work With Nigeria&apos;s Best?</h2>
            <p className="text-indigo-100 text-lg mb-8">
              Join 15+ businesses that trust Omnix Lab for their software development needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-xl">
                Start Your Project →
              </Link>
              <a href="mailto:Akomolafenathaniel123@gmail.com" className="inline-flex px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors">
                Email the Founder
              </a>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}