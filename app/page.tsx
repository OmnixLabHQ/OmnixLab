'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import TrustBadges from '@/components/TrustBadges'
import Testimonials from '@/components/Testimonials'
import WhatsAppBubble from '@/components/WhatsAppBubble'
import CounterSection from '@/components/CounterSection'
import SkillsMarquee from '@/components/SkillsMarquee'
import AdvancedHero from '@/components/AdvancedHero'

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      
      {/* ========== ADVANCED HERO ========== */}
      <AdvancedHero />

      {/* ========== SKILLS MARQUEE ========== */}
      <SkillsMarquee />

      {/* ========== TRUST BADGES ========== */}
      <TrustBadges />

      {/* ========== CLIENTS ========== */}
      <motion.section 
        {...fadeInUp}
        className="py-16 px-6 lg:px-8 border-b border-gray-100 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-10">Trusted by innovative companies worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50">
            {['FinEdge Capital', 'CloudStack Solutions', 'DataVault Systems', 'NexGen Trading'].map((name, i) => (
              <motion.span 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-xl md:text-2xl font-bold text-gray-400 tracking-tight"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ========== SERVICES ========== */}
      <section id="services" className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16 lg:mb-20">
            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">What we do</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">End-to-end development across the entire digital ecosystem</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: 'Web Development', desc: 'Custom websites and web applications built with React, Next.js, and modern frameworks. Fast, responsive, and SEO-optimized.', icon: '🌐' },
              { title: 'Trading Bot Development', desc: 'Algorithmic trading systems for crypto, forex, and stock markets. Automated strategies with real-time execution and risk controls.', icon: '📈' },
              { title: 'Software Development', desc: 'Enterprise-grade SaaS platforms, internal tools, and business automation systems tailored to your exact requirements.', icon: '⚙️' },
              { title: 'Mobile Applications', desc: 'Native and cross-platform mobile apps for iOS and Android that deliver seamless user experiences on every device.', icon: '📱' },
              { title: 'AI & Automation', desc: 'Intelligent solutions leveraging machine learning, natural language processing, and predictive analytics.', icon: '🤖' },
              { title: 'Cloud & DevOps', desc: 'Scalable cloud infrastructure on AWS, Vercel, and Railway. CI/CD pipelines, monitoring, and 99.9% uptime.', icon: '☁️' },
            ].map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, boxShadow: '0 30px 60px rgba(99,102,241,0.15)' }}
                className="group p-8 lg:p-10 rounded-2xl border border-gray-200 hover:border-indigo-200 transition-all duration-300 bg-white cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity -mr-8 -mt-8" />
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{service.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COUNTER SECTION ========== */}
      <CounterSection />

      {/* ========== TESTIMONIALS ========== */}
      <Testimonials />

      {/* ========== PROCESS ========== */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16 lg:mb-20">
            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">How we work</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our Process</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">A proven methodology refined over 50+ successful projects</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', desc: 'We dive deep into your business goals, target audience, and technical requirements.' },
              { step: '02', title: 'Strategy', desc: 'Our team creates a detailed roadmap with architecture, timeline, and milestones.' },
              { step: '03', title: 'Build', desc: 'Agile development with regular updates, ensuring transparency at every stage.' },
              { step: '04', title: 'Launch', desc: 'Rigorous testing, deployment, and ongoing support to ensure long-term success.' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.03 }}
                className="relative cursor-pointer group"
              >
                <div className="absolute -left-4 top-0 text-8xl font-bold text-gray-50 group-hover:text-indigo-50 transition-colors select-none">{item.step}</div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <motion.div 
          {...fadeInUp}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Ready to Start Your Project?</h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Let&apos;s discuss how Omnix Lab can bring your vision to life. Reach out today for a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/contact" className="inline-flex px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 items-center justify-center gap-2 shadow-2xl">
                <span>💬</span> Get in Touch
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a href="mailto:Akomolafenathaniel123@gmail.com" className="inline-flex px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm">
                Send an Email
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========== WHATSAPP BUBBLE ========== */}
      <WhatsAppBubble />

    </div>
  )
}