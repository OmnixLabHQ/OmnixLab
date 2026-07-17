'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import TrustBadges from '@/components/TrustBadges'
import Testimonials from '@/components/Testimonials'
import WhatsAppBubble from '@/components/WhatsAppBubble'

export default function Home() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (orbRef.current) {
        const x = (e.clientX / window.innerWidth) * 20
        const y = (e.clientY / window.innerHeight) * 20
        orbRef.current.style.transform = `translate(${x}px, ${y}px)`
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }

  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      
      {/* ========== HERO ========== */}
      <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        
        <div 
          ref={orbRef}
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] transition-transform duration-1000 ease-out hidden lg:block"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
        ></div>

        <div className="absolute top-20 left-10 w-3 h-3 bg-indigo-300 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-purple-300 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-indigo-200 rounded-full opacity-40 animate-bounce"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-2 mb-6"
              >
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Full-Service Development Studio</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-[3rem] md:text-[4.5rem] lg:text-[5rem] font-bold leading-[1.05] tracking-tight text-gray-900 mb-6"
              >
                We build digital products that{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">drive growth</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl mb-10"
              >
                Omnix Lab partners with forward-thinking businesses to design, build, 
                and scale custom web applications, trading systems, and enterprise software.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <Link 
                  href="/contact"
                  className="group px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all duration-300 inline-flex items-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                >
                  Start your project
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                    <path d="M6 4l4 4-4 4"/>
                  </svg>
                </Link>
                <Link 
                  href="/services" 
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  View our services
                </Link>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="flex gap-8 pt-6 border-t border-gray-200"
              >
                {[
                  { number: '50+', label: 'Projects' },
                  { number: '15+', label: 'Clients' },
                  { number: '99%', label: 'Satisfaction' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 bg-white hover:shadow-3xl transition-shadow duration-500">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full"
                    ></motion.div>
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                      className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full"
                    ></motion.div>
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      className="text-center text-white"
                    >
                      <div className="text-7xl font-bold mb-4">OL</div>
                      <div className="text-xl font-medium tracking-widest uppercase">Omnix Lab</div>
                      <div className="mt-4 w-20 h-1 bg-white/50 mx-auto rounded-full"></div>
                      <div className="mt-4 text-sm font-light tracking-wider uppercase opacity-80">Development Studio</div>
                    </motion.div>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">50+ Projects</div>
                      <div className="text-xs text-gray-500">Delivered globally</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">⚡</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Fast Delivery</div>
                      <div className="text-xs text-gray-500">On time, every time</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="lg:hidden"
            >
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 aspect-[4/3] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-5xl font-bold mb-2">OL</div>
                    <div className="text-lg font-medium tracking-widest uppercase">Omnix Lab</div>
                    <div className="mt-3 w-16 h-0.5 bg-white/50 mx-auto rounded-full"></div>
                    <div className="mt-3 text-xs tracking-wider uppercase opacity-80">Development Studio</div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========== TRUST BADGES ========== */}
      <TrustBadges />

      {/* ========== CLIENTS ========== */}
      <motion.section 
        {...fadeInUp}
        className="py-12 px-6 lg:px-8 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-8">Trusted by innovative companies worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50">
            {['FinEdge Capital', 'CloudStack Solutions', 'DataVault Systems', 'NexGen Trading'].map((name, i) => (
              <motion.span 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-lg md:text-xl font-bold text-gray-400 tracking-tight"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ========== SERVICES ========== */}
      <section id="services" className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16 lg:mb-20">
            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">What we do</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our services</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">End-to-end development across the entire digital ecosystem</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: 'Web Development', desc: 'Custom websites and web applications built with React, Next.js, and modern frameworks. Fast, responsive, and SEO-optimized.' },
              { title: 'Trading Bot Development', desc: 'Algorithmic trading systems for crypto, forex, and stock markets. Automated strategies with real-time execution and risk controls.' },
              { title: 'Software Development', desc: 'Enterprise-grade SaaS platforms, internal tools, and business automation systems tailored to your exact requirements.' },
              { title: 'Mobile Applications', desc: 'Native and cross-platform mobile apps for iOS and Android that deliver seamless user experiences on every device.' },
              { title: 'AI & Automation', desc: 'Intelligent solutions leveraging machine learning, natural language processing, and predictive analytics.' },
              { title: 'Cloud & DevOps', desc: 'Scalable cloud infrastructure on AWS, Vercel, and Railway. CI/CD pipelines, monitoring, and 99.9% uptime.' },
            ].map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(99,102,241,0.1)' }}
                className="group p-8 lg:p-10 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-all duration-300 bg-white cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <Testimonials />

      {/* ========== PROCESS ========== */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16 lg:mb-20">
            <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">How we work</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our process</h2>
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
                className="cursor-pointer"
              >
                <motion.div 
                  className="text-indigo-200 text-6xl font-bold mb-4"
                  whileHover={{ scale: 1.1, color: '#818CF8' }}
                  transition={{ duration: 0.3 }}
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900 text-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { number: '50+', label: 'Projects Completed' },
              { number: '15+', label: 'Active Clients' },
              { number: '4+', label: 'Years Experience' },
              { number: '99%', label: 'Client Satisfaction' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <motion.div 
          {...fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">Ready to start your project?</h2>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Let&apos;s discuss how Omnix Lab can bring your vision to life. Reach out today for a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/contact" className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all duration-300 items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                <span>💬</span> Get in touch
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a href="mailto:Akomolafenathaniel123@gmail.com" className="inline-flex px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center">
                Send an email
              </a>
            </motion.div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Email', value: 'Akomolafenathaniel123@gmail.com' },
              { label: 'WhatsApp', value: '+234 703 370 2874' },
              { label: 'Location', value: 'Global / Remote' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -4 }}
                className="p-5 rounded-xl border border-gray-100 cursor-pointer transition-shadow hover:shadow-md"
              >
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase">{item.label}</p>
                <p className="text-sm text-gray-700 break-all font-medium">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========== WHATSAPP BUBBLE ========== */}
      <WhatsAppBubble />

    </div>
  )
}