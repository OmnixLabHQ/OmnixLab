'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

const services = [
  { number: '01', title: 'Custom Software Development', desc: 'Business applications, internal platforms and specialized software.', icon: '⚙️' },
  { number: '02', title: 'Web & SaaS Development', desc: 'High-performance websites, SaaS platforms and web applications.', icon: '🌐' },
  { number: '03', title: 'AI & Intelligent Solutions', desc: 'AI-powered applications, automation and intelligent workflows.', icon: '🤖' },
  { number: '04', title: 'Trading & Financial Technology', desc: 'Trading bots, market systems, analytics and automation.', icon: '📈' },
  { number: '05', title: 'Mobile Application Development', desc: 'iOS, Android and cross-platform applications.', icon: '📱' },
  { number: '06', title: 'Business Automation', desc: 'Systems that automate repetitive processes and improve operational efficiency.', icon: '🔄' },
]

const whyOmnix = [
  { title: 'Business First', desc: 'Technology decisions are connected to the actual business objective.', icon: '🎯' },
  { title: 'Modern Development', desc: 'Solutions are built using current development technologies and scalable software design.', icon: '💻' },
  { title: 'Transparent Delivery', desc: 'Clients can follow projects, communicate, review files and monitor progress through the Client Workspace.', icon: '👁️' },
  { title: 'Long-Term Thinking', desc: 'The objective is not simply to launch software. It is to create something that can evolve with the business.', icon: '📈' },
]

const featuredWork = [
  { title: 'Crypto Trading Platform', category: 'Trading Technology', desc: 'Real-time trading automation platform built for high-speed market execution.', image: '/images/trading-platform.jpg', link: '/work/crypto-trading-platform', result: 'Automated execution' },
  { title: 'Healthcare SaaS Platform', category: 'SaaS Platform', desc: 'Centralized healthcare management software designed to simplify appointments, patient information and operational workflows.', image: '/images/healthcare-saas.jpg', link: '/work/healthcare-saas', result: '80% faster scheduling' },
  { title: 'AI Content Generator', category: 'AI & Automation', desc: 'AI-powered content generation platform with team collaboration, SEO optimization, and brand voice control.', image: '/images/ai-content-generator.jpg', link: '/work/ai-content-generator', result: '10x content output' },
]

const processSteps = [
  { step: '01', title: 'Discover', desc: 'Understand the business, problem and desired outcome.' },
  { step: '02', title: 'Plan', desc: 'Define requirements, product direction and implementation strategy.' },
  { step: '03', title: 'Build', desc: 'Develop the product through controlled development cycles.' },
  { step: '04', title: 'Validate', desc: 'Test functionality, performance, usability and reliability.' },
  { step: '05', title: 'Launch & Grow', desc: 'Deploy the product and continue improving it as the business evolves.' },
]

const technologies = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'APIs'] },
  { category: 'Database', items: ['PostgreSQL', 'Supabase'] },
  { category: 'Infrastructure', items: ['Cloud', 'CI/CD', 'Monitoring'] },
  { category: 'AI', items: ['LLMs', 'Automation', 'Intelligent systems'] },
]

const industries = [
  { name: 'Financial Technology', icon: '🏦' },
  { name: 'E-commerce', icon: '🛒' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Logistics', icon: '🚚' },
  { name: 'SaaS', icon: '📦' },
  { name: 'Professional Services', icon: '💼' },
  { name: 'Real Estate', icon: '🏠' },
  { name: 'Technology', icon: '💻' },
  { name: 'Startups', icon: '🚀' },
  { name: 'Enterprise Businesses', icon: '🏢' },
]

const faqs = [
  { q: 'What type of software does Omnix Lab build?', a: 'We build custom software, web applications, SaaS platforms, mobile apps, AI solutions, trading systems, e-commerce platforms, business automation, and API integrations.' },
  { q: 'How does the development process work?', a: 'We follow a structured process: Discover, Plan, Build, Validate, and Launch. You get weekly updates and a dedicated Client Workspace to track everything.' },
  { q: 'How long does a project take?', a: 'Timelines depend on complexity. Most projects range from 6 to 12 weeks. We provide a detailed estimate after the discovery phase.' },
  { q: 'Can you work with an existing application?', a: 'Yes. We can audit, modernize, extend, or take over development of an existing codebase.' },
  { q: 'Do you provide post-launch support?', a: 'Yes. We offer ongoing maintenance, monitoring, feature updates, security patches, and technical support.' },
  { q: 'How do clients monitor their projects?', a: 'Every client gets a private Client Workspace where they can view projects, files, messages, invoices, payments, ideas, and activity.' },
  { q: 'How do payments work?', a: 'We provide transparent invoicing and support multiple payment methods, including online payments, bank transfer, and USDT.' },
  { q: 'Can I start with an idea before defining the full project?', a: 'Absolutely. We help you shape the idea, define the scope, and build an MVP first if needed.' },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeIndustry, setActiveIndustry] = useState(0)

  return (
    <div className="bg-gray-950 text-white min-h-screen overflow-hidden">
      {/* NOISE TEXTURE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

      <div className="relative z-10">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('/images/home-hero.jpg')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
          </div>
          {/* Glow */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 10}s`, animationDuration: `${8 + Math.random() * 10}s` }} />
          ))}

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">Global Software Development</p>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">Build Digital Products That Move Your Business Forward.</h1>
              <p className="text-lg text-gray-300 mb-10">Omnix Lab builds high-performance software, SaaS platforms, AI solutions, trading systems, web applications and mobile products for ambitious businesses worldwide.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">Start a Project</Link>
                <Link href="/work" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors">Explore Our Work</Link>
              </div>
              {/* Trust metrics - restrained */}
              <div className="mt-12 grid grid-cols-4 gap-4">
                {[['50+', 'Projects'], ['99%', 'Satisfaction'], ['Global', 'Delivery'], ['24/7', 'Systems']].map(([value, label]) => (
                  <div key={label} className="text-center">
                    <p className="text-xl font-bold text-blue-400">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating UI cards */}
            <div className="relative h-[400px] lg:h-[500px] hidden md:block">
              <div className="absolute top-10 right-0 w-72 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-300">Project</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Active</span>
                </div>
                <p className="font-semibold text-white mb-2">E-Commerce Platform</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">82% complete</p>
              </div>
              <div className="absolute bottom-20 left-0 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                <p className="text-xs text-gray-300 mb-1">Payment</p>
                <p className="text-2xl font-bold text-white">$4,800</p>
                <p className="text-xs text-green-300 mt-1">✓ Confirmed</p>
              </div>
              <div className="absolute top-40 left-10 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                <p className="text-xs text-gray-300 mb-1">New Message</p>
                <p className="text-sm font-medium text-white">Omnix Lab</p>
                <p className="text-xs text-gray-400">Dashboard v4 ready...</p>
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY STRIP */}
        <section className="py-12 border-y border-white/10 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400 mb-6">Built With Modern Technology</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Next.js', 'React', 'Node.js', 'TypeScript', 'Python', 'AI', 'Cloud', 'Supabase', 'PostgreSQL', 'APIs'].map((tech) => (
                <span key={tech} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">{tech}</span>
              ))}
            </div>
          </div>
        </section>

        {/* COMPANY INTRODUCTION */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <h2 className="text-3xl md:text-4xl font-bold leading-snug">Software built around your business.</h2>
            <div className="text-gray-300 space-y-4">
              <p>Omnix Lab helps businesses turn complex ideas into reliable digital products. From business platforms and SaaS applications to AI systems, mobile applications and automated solutions, we combine product thinking, software development and modern technology to create solutions designed for real-world growth.</p>
              <Link href="/about" className="inline-flex text-blue-400 hover:text-blue-300">Discover Omnix Lab →</Link>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">What we do</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Technology Solutions Built Around Your Ambition</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Six premium capabilities designed to cover the entire digital product lifecycle.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.number} className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:shadow-xl transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <span className="text-3xl font-bold text-blue-400">{service.number}</span>
                    <div className="text-3xl my-3">{service.icon}</div>
                    <h3 className="text-xl font-bold text-white mt-2 mb-2 group-hover:text-blue-400 transition-colors">{service.title}</h3>
                    <p className="text-gray-400 text-sm">{service.desc}</p>
                    <span className="inline-flex mt-4 text-blue-400 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY OMNIX LAB */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Businesses That Think Beyond Today</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyOmnix.map((item) => (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLIENT WORKSPACE */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Project. Your Workspace. Your Visibility.</h2>
              <p className="text-gray-300 mb-6">Every client receives a dedicated workspace to manage communication, projects, files, invoices, payments, ideas and important project information in one secure environment.</p>
              <Link href="/portal" className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Explore Client Workspace</Link>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="ml-2 text-sm text-gray-400">Client Workspace</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Project Progress</span>
                  <span className="text-sm text-white font-semibold">78%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }}></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 text-sm"><p className="text-gray-300">Milestones</p><p className="text-white font-semibold">4 of 6</p></div>
                  <div className="bg-white/5 rounded-lg p-3 text-sm"><p className="text-gray-300">Files</p><p className="text-white font-semibold">12</p></div>
                  <div className="bg-white/5 rounded-lg p-3 text-sm"><p className="text-gray-300">Invoices</p><p className="text-white font-semibold">2</p></div>
                  <div className="bg-white/5 rounded-lg p-3 text-sm"><p className="text-gray-300">Messages</p><p className="text-white font-semibold">3 new</p></div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-sm"><p className="text-gray-300">Recent Activity</p><p className="text-gray-400 text-xs mt-1">Milestone approved: UI Design</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED WORK - Editorial Cards */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Selected Work</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredWork.map((work) => (
                <Link key={work.title} href={work.link} className="group">
                  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={work.image} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-blue-400 uppercase tracking-wider">{work.category}</p>
                      <h3 className="text-xl font-bold text-white mt-1 mb-2">{work.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{work.desc}</p>
                      <p className="text-green-400 text-sm font-medium">{work.result}</p>
                      <span className="inline-flex mt-3 text-blue-400 text-sm group-hover:underline">View Case Study →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Technology With Measurable Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[['50+', 'Projects Delivered'], ['99%', 'Client Satisfaction'], ['24/7', 'Digital Systems'], ['Global', 'Client Delivery']].map(([value, label]) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6"><p className="text-4xl font-bold text-blue-400">{value}</p><p className="text-gray-300 mt-2">{label}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* INDUSTRIES - Interactive */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built Across Industries</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {industries.map((industry, i) => (
                <button key={industry.name} onClick={() => setActiveIndustry(i)} className={`px-5 py-3 rounded-full text-sm transition-colors ${activeIndustry === i ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>{industry.name}</button>
              ))}
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-5xl mb-4">{industries[activeIndustry].icon}</div>
              <p className="text-xl font-bold text-white">{industries[activeIndustry].name}</p>
              <p className="text-gray-400 mt-2">Omnix Lab delivers software solutions designed for the {industries[activeIndustry].name} sector.</p>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">From Idea to Production</h2>
            <div className="grid md:grid-cols-5 gap-8">
              {processSteps.map((step) => (
                <div key={step.step} className="text-center">
                  <span className="text-3xl font-bold text-blue-400">{step.step}</span>
                  <h3 className="font-semibold text-white mt-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Modern Technology. Purposefully Applied.</h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">We choose technology based on the product, not because it is fashionable.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {technologies.map((tech) => (
                <div key={tech.category} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-3">{tech.category}</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">{tech.items.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GOOGLE REVIEWS */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
            <div className="elfsight-app-28ec5cc5-1b75-4676-8297-2f762021b150" data-elfsight-app-lazy></div>
          </div>
        </section>

        {/* GLOBAL CLIENTS */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Businesses Worldwide</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">Omnix Lab works with businesses and entrepreneurs beyond borders, delivering software solutions through a modern digital development process.</p>
            {/* World map visual */}
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
              </div>
              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                {['Africa', 'Europe', 'North America', 'Middle East', 'Asia', 'Australia', 'South America', 'Remote Global'].map((region) => (
                  <div key={region} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    {region}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex justify-between items-center px-6 py-4 text-left">
                    <span className="font-medium text-white">{faq.q}</span>
                    <span className={`text-blue-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="px-6 pb-4 text-gray-400 text-sm">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Have a Product in Mind? Let's Build It.</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Tell us what you're trying to build, improve or automate. We'll help turn the idea into a practical software solution.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start a Project</Link>
              <a href="mailto:helloafrica@omnixlab-production.up.railway.app" className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20">Talk to Omnix Lab</a>
            </div>
          </div>
        </section>

        {/* Elfsight Script */}
        <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      </div>
    </div>
  )
}