'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  slug: string
  title: string
  client: string
  category: string
  heroImage: string
  problem: string
  solution: string
  metrics: { label: string; value: string }[]
  tech: string[]
  testimonial: { quote: string; author: string; role: string }
  timeline: string
  gradient: string
  icon: string
  features: string[]
}

const projects: Project[] = [
  {
    slug: 'crypto-trading-platform',
    title: 'Crypto Trading Platform',
    client: 'FinEdge Capital',
    category: 'Trading Systems',
    heroImage: '📈',
    problem: 'Manual trading caused missed opportunities and inconsistent profits. The client needed 24/7 automated execution with real time risk management.',
    solution: 'Built a high frequency trading bot with real time analytics, automated execution, and a comprehensive risk management dashboard.',
    metrics: [
      { label: 'Execution Speed', value: '0.003ms' },
      { label: 'Monthly Return', value: '18%' },
      { label: 'Uptime', value: '99.9%' },
      { label: 'Trades/Month', value: '10,000+' }
    ],
    tech: ['Python', 'CCXT', 'PostgreSQL', 'WebSocket', 'AWS'],
    testimonial: {
      quote: "Omnix Lab's trading bot has been a game changer for our firm. Consistent returns with zero manual intervention.",
      author: 'Michael Chen',
      role: 'CEO, FinEdge Capital'
    },
    timeline: '8 weeks',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '📈',
    features: ['Real time analytics', 'Risk management', 'Multi exchange', 'Backtesting']
  },
  {
    slug: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    client: 'CloudStack Solutions',
    category: 'E-Commerce',
    heroImage: '🛒',
    problem: 'Outdated platform could not handle growing traffic and lacked mobile optimization, causing lost sales.',
    solution: 'Developed a modern, responsive e-commerce platform with inventory management, payment processing, and analytics.',
    metrics: [
      { label: 'Mobile Sales Increase', value: '200%' },
      { label: 'Page Load Time', value: '1.2s' },
      { label: 'Products Managed', value: '50,000+' },
      { label: 'Uptime', value: '99.9%' }
    ],
    tech: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe'],
    testimonial: {
      quote: "Our sales doubled after Omnix Lab rebuilt our platform. The mobile experience is now seamless.",
      author: 'Sarah Johnson',
      role: 'Founder, CloudStack Solutions'
    },
    timeline: '6 weeks',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🛒',
    features: ['Payment integration', 'Inventory system', 'Analytics', 'Mobile first']
  },
  {
    slug: 'healthcare-saas',
    title: 'Healthcare SaaS Platform',
    client: 'MediCare Plus',
    category: 'SaaS Platforms',
    heroImage: '🏥',
    problem: 'Patient data was scattered across multiple systems, causing scheduling conflicts and delays in care.',
    solution: 'Created a centralized patient management system with telemedicine, appointment scheduling, and secure medical records.',
    metrics: [
      { label: 'Scheduling Time Reduced', value: '80%' },
      { label: 'Patients Onboarded', value: '10,000+' },
      { label: 'Compliance', value: 'HIPAA' },
      { label: 'Patient Satisfaction', value: '95%' }
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'WebRTC', 'AWS'],
    testimonial: {
      quote: "Omnix Lab built exactly what we needed. Our operations are streamlined and patients love the telemedicine feature.",
      author: 'Dr. Amina Yusuf',
      role: 'CEO, MediCare Plus'
    },
    timeline: '12 weeks',
    gradient: 'from-purple-500 to-pink-600',
    icon: '🏥',
    features: ['Appointments', 'Telemedicine', 'Secure records', 'HIPAA compliant']
  },
  {
    slug: 'fintech-dashboard',
    title: 'FinTech Dashboard',
    client: 'DataVault Systems',
    category: 'Data & Analytics',
    heroImage: '💹',
    problem: 'Financial analysts needed a real time dashboard to monitor market data across multiple exchanges simultaneously.',
    solution: 'Built a real time data visualization dashboard with live market streams, portfolio tracking, and custom reporting.',
    metrics: [
      { label: 'Data Latency', value: '<100ms' },
      { label: 'Exchanges Connected', value: '5' },
      { label: 'Custom Reports', value: '50+' },
      { label: 'User Adoption', value: '100%' }
    ],
    tech: ['Next.js', 'WebSocket', 'D3.js', 'Node.js', 'Redis'],
    testimonial: {
      quote: "The dashboard Omnix Lab built gives us a competitive edge. Real time data at our fingertips.",
      author: 'David Okafor',
      role: 'CTO, DataVault Systems'
    },
    timeline: '10 weeks',
    gradient: 'from-violet-500 to-purple-600',
    icon: '💹',
    features: ['Live data', 'Portfolio tracking', 'Custom charts', 'Reports']
  },
  {
    slug: 'delivery-mobile-app',
    title: 'Delivery Mobile App',
    client: 'SwiftDeliver',
    category: 'Mobile Applications',
    heroImage: '📱',
    problem: 'Manual dispatch system caused delays and poor customer experience with no real time tracking.',
    solution: 'Built a cross platform delivery app with real time tracking, driver management, and push notifications.',
    metrics: [
      { label: 'App Rating', value: '4.8★' },
      { label: 'Delivery Time Reduced', value: '35%' },
      { label: 'Active Drivers', value: '500+' },
      { label: 'Customer Satisfaction', value: '92%' }
    ],
    tech: ['React Native', 'Firebase', 'Google Maps API', 'Node.js', 'MongoDB'],
    testimonial: {
      quote: "Our delivery operations are now fully automated. The app is fast, reliable, and our customers love the live tracking.",
      author: 'James Okonkwo',
      role: 'Founder, SwiftDeliver'
    },
    timeline: '8 weeks',
    gradient: 'from-orange-500 to-red-500',
    icon: '📱',
    features: ['Live tracking', 'Push notifications', 'Driver dashboard', 'Wallet']
  },
  {
    slug: 'ai-content-generator',
    title: 'AI Content Generator',
    client: 'ContentPro',
    category: 'AI Solutions',
    heroImage: '🤖',
    problem: 'Content team struggled to scale production while maintaining quality and brand voice consistency.',
    solution: 'Built an AI powered content generation platform with team collaboration, SEO optimization, and brand voice control.',
    metrics: [
      { label: 'Content Output', value: '1M+/month' },
      { label: 'Time Saved', value: '70%' },
      { label: 'SEO Score', value: '90+' },
      { label: 'Team Adoption', value: '100%' }
    ],
    tech: ['Python', 'OpenAI API', 'Next.js', 'PostgreSQL', 'LangChain'],
    testimonial: {
      quote: "Omnix Lab's AI platform transformed our content operation. We now produce 10x more content with consistent quality.",
      author: 'Grace Okonkwo',
      role: 'CEO, ContentPro'
    },
    timeline: '10 weeks',
    gradient: 'from-cyan-500 to-blue-600',
    icon: '🤖',
    features: ['GPT integration', 'Team collaboration', 'SEO optimization', 'Brand voice']
  }
]

const categories = ['All', 'Trading Systems', 'E-Commerce', 'SaaS Platforms', 'Data & Analytics', 'Mobile Applications', 'AI Solutions']

export default function WorkPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredProjects = activeFilter === 'All' ? projects : projects.filter(p => p.category === activeFilter)

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* HERO */}
<section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden">
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('/images/about-hero.jpg')" }}
  />
  <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-indigo-950/85 to-black/90" />
  <div className="absolute inset-0 opacity-10">
    <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
  </div>
  <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />

  <div className="relative z-10 max-w-7xl mx-auto text-center">
    <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">Our Portfolio</p>
    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
      Software Built to Solve Real Business Challenges
    </h1>
    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
      Explore selected software products, platforms, applications, and digital solutions developed by Omnix Lab for businesses across different industries.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
        Start Your Project
      </Link>
      <a href="#portfolio" className="inline-flex px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors">
        Explore Our Work
      </a>
    </div>

    {/* Trust metrics */}
    <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
      {[
        ['50+', 'Projects Delivered'],
        ['99%', 'Client Satisfaction'],
        ['Global', 'Delivery'],
        ['Enterprise', 'Technology'],
      ].map(([num, label]) => (
        <div key={label} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{num}</p>
          <p className="text-xs text-gray-300 mt-1">{label}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* INDUSTRY STRIP */}
      <section className="px-6 lg:px-8 py-12 border-y border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-6">Selected Work Across Multiple Industries</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['FinTech', 'Healthcare', 'E-Commerce', 'Logistics', 'SaaS', 'AI', 'Trading', 'Business Operations'].map(industry => (
              <span key={industry} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-full">
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECT */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured Case Study</h2>
          <div onClick={() => setSelectedProject(projects[0])} className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer group hover:bg-white/10 transition-all">
            <div className={`aspect-[21/9] bg-gradient-to-br ${projects[0].gradient} relative overflow-hidden flex items-center justify-center`}>
              <span className="text-8xl opacity-60 group-hover:scale-110 transition-transform duration-500">{projects[0].icon}</span>
            </div>
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Featured</span>
                <span className="text-gray-400 text-sm">{projects[0].category}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">{projects[0].title}</h3>
              <p className="text-gray-300 max-w-2xl">{projects[0].problem}</p>
              <span className="inline-flex mt-4 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full group-hover:bg-gray-200 transition-colors">
                View Case Study →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS + PORTFOLIO */}
      <section id="portfolio" className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Explore Our Work</h2>
          <div className="flex flex-wrap gap-3 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.slug}
                onClick={() => setSelectedProject(project)}
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className={`aspect-[4/3] bg-gradient-to-br ${project.gradient} relative overflow-hidden flex items-center justify-center`}>
                  <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform duration-500">{project.icon}</span>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {project.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.problem}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.features.slice(0, 3).map((feature, j) => (
                      <span key={j} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-md border border-white/10">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-blue-400 font-medium text-sm group-hover:underline">
                    View Case Study →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">How We Create Value</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              ['Product Development', 'Custom software built around business goals.'],
              ['AI Solutions', 'Automation and intelligent systems.'],
              ['SaaS Platforms', 'Multi-tenant products and dashboards.'],
              ['Business Automation', 'Replace manual workflows with software.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Build Something?</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Tell us what you are building, what you are trying to improve, or the problem you are trying to solve.
          </p>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
            Start Your Project →
          </Link>
        </div>
      </section>

      {/* CASE STUDY MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 rounded-t-3xl p-4 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">{selectedProject.category}</span>
                <span className="text-sm text-gray-400">Timeline: {selectedProject.timeline}</span>
              </div>
              <button onClick={() => setSelectedProject(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{selectedProject.title}</h2>
                <p className="text-lg text-gray-400">Client: {selectedProject.client}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/20">
                  <h3 className="font-bold text-red-400 mb-2">The Problem</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedProject.problem}</p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/20">
                  <h3 className="font-bold text-green-400 mb-2">The Solution</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedProject.solution}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">Key Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedProject.metrics.map((metric, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                      <div className="text-xl font-bold text-blue-400">{metric.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech.map((tech, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-3">"</div>
                <p className="italic mb-4">{selectedProject.testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    {selectedProject.testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{selectedProject.testimonial.author}</p>
                    <p className="text-indigo-200 text-sm">{selectedProject.testimonial.role}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                  Start a Similar Project →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}