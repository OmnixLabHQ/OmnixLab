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
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Software Built to Solve Real Business Challenges
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Explore selected software products, platforms, applications, and digital solutions developed by Omnix Lab for businesses across different industries.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors">
              Start Your Project
            </Link>
            <a href="#portfolio" className="inline-flex px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-indigo-300 transition-colors">
              Explore Our Work
            </a>
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="mb-16">
          <p className="text-center text-sm text-gray-500 mb-6">Selected Work Across Multiple Industries</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['FinTech', 'Healthcare', 'E-Commerce', 'Logistics', 'SaaS', 'AI', 'Trading', 'Business Operations'].map(industry => (
              <span key={industry} className="px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-full border border-gray-100">
                {industry}
              </span>
            ))}
          </div>
        </div>

        {/* FEATURED PROJECT */}
        <div className="mb-20">
          <div onClick={() => setSelectedProject(projects[0])} className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer block">
            <div className="aspect-[21/9] bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="chart" width="60" height="60" patternUnits="userSpaceOnUse">
                      <rect width="60" height="60" fill="none" stroke="white" strokeWidth="0.3" opacity="0.3"/>
                      <circle cx="30" cy="30" r="2" fill="white" opacity="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#chart)" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">Featured</span>
                  <span className="text-gray-300 text-sm">Trading Systems</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">{projects[0].title}</h2>
                <p className="text-gray-300 max-w-2xl">{projects[0].problem}</p>
                <span className="inline-flex mt-4 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-200 transition-colors">
                  View Case Study →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div id="portfolio" className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PROJECT GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.slug}
              onClick={() => setSelectedProject(project)}
              className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 cursor-pointer block"
            >
              <div className={`aspect-[4/3] bg-gradient-to-br ${project.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">{project.icon}</span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-3">{project.problem}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.features.map((feature, j) => (
                    <span key={j} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                      {feature}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm group-hover:underline">
                  View Case Study →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CAPABILITIES */}
        <div className="mt-20 grid md:grid-cols-4 gap-6">
          {[
            ['Product Development', 'Custom software built around business goals.'],
            ['AI Solutions', 'Automation and intelligent systems.'],
            ['SaaS Platforms', 'Multi-tenant products and dashboards.'],
            ['Business Automation', 'Replace manual workflows with software.'],
          ].map(([title, desc]) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* FINAL CTA */}
        <div className="text-center mt-20">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 lg:p-14 text-white">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">Have a product in mind?</h2>
            <p className="text-indigo-100 mb-8">
              Tell us what you are building, what you are trying to improve, or the problem you are trying to solve.
            </p>
            <Link href="/contact" className="inline-flex px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors">
              Start Your Project →
            </Link>
          </div>
        </div>
      </div>

      {/* CASE STUDY MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-3xl p-4 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">{selectedProject.category}</span>
                <span className="text-sm text-gray-400">Timeline: {selectedProject.timeline}</span>
              </div>
              <button onClick={() => setSelectedProject(null)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{selectedProject.title}</h2>
                <p className="text-lg text-gray-500">Client: {selectedProject.client}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <h3 className="font-bold text-red-700 mb-2">The Problem</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedProject.problem}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                  <h3 className="font-bold text-green-700 mb-2">The Solution</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedProject.solution}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedProject.metrics.map((metric, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                      <div className="text-xl font-bold text-indigo-600">{metric.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech.map((tech, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
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
                <Link href="/contact" className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors">
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