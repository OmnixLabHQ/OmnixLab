'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  slug: string
  title: string
  client: string
  category: string
  industry: string
  heroImage: string
  problem: string
  solution: string
  metrics: { label: string; value: string }[]
  tech: string[]
  testimonial: { quote: string; author: string; role: string }
  timeline: string
  features: string[]
}

const projects: Project[] = [
  {
    slug: 'crypto-trading-platform',
    title: 'Crypto Trading Platform',
    client: 'FinEdge Capital',
    category: 'Trading Systems',
    industry: 'FinTech',
    heroImage: '/images/trading-platform.jpg',
    problem: 'Manual trading caused missed opportunities and inconsistent profits in volatile markets.',
    solution: 'Built a high frequency trading system with real time analytics and automated execution.',
    metrics: [
      { label: 'Execution Speed', value: '0.003ms' },
      { label: 'Monthly Return', value: '18%' },
      { label: 'Uptime', value: '99.9%' },
      { label: 'Trades/Month', value: '10,000+' }
    ],
    tech: ['Python', 'CCXT', 'PostgreSQL', 'WebSocket', 'AWS'],
    testimonial: {
      quote: "Omnix Lab delivered exactly what we needed. Consistent returns with zero manual intervention.",
      author: 'Michael Chen',
      role: 'CEO, FinEdge Capital'
    },
    timeline: '8 weeks',
    features: ['Real time analytics', 'Risk management', 'Multi exchange', 'Backtesting']
  },
  {
    slug: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    client: 'CloudStack Solutions',
    category: 'E-Commerce',
    industry: 'Retail',
    heroImage: '/images/ecommerce-platform.jpg',
    problem: 'Outdated platform could not handle growing traffic and mobile optimization.',
    solution: 'Developed a modern e-commerce platform with inventory management and payment processing.',
    metrics: [
      { label: 'Mobile Sales Increase', value: '200%' },
      { label: 'Page Load Time', value: '1.2s' },
      { label: 'Products Managed', value: '50,000+' },
      { label: 'Uptime', value: '99.9%' }
    ],
    tech: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe'],
    testimonial: {
      quote: "Our sales doubled after Omnix Lab rebuilt our platform.",
      author: 'Sarah Johnson',
      role: 'Founder, CloudStack Solutions'
    },
    timeline: '6 weeks',
    features: ['Payment integration', 'Inventory system', 'Analytics', 'Mobile first']
  },
  {
    slug: 'healthcare-saas',
    title: 'Healthcare SaaS Platform',
    client: 'MediCare Plus',
    category: 'SaaS Platforms',
    industry: 'Healthcare',
    heroImage: '/images/healthcare-saas.jpg',
    problem: 'Patient data was scattered across multiple systems causing scheduling conflicts.',
    solution: 'Created a centralized patient management system with telemedicine and secure records.',
    metrics: [
      { label: 'Scheduling Time Reduced', value: '80%' },
      { label: 'Patients Onboarded', value: '10,000+' },
      { label: 'Compliance', value: 'HIPAA' },
      { label: 'Patient Satisfaction', value: '95%' }
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'WebRTC', 'AWS'],
    testimonial: {
      quote: "Omnix Lab built exactly what we needed. Our operations are streamlined and patients love telemedicine.",
      author: 'Dr. Amina Yusuf',
      role: 'CEO, MediCare Plus'
    },
    timeline: '12 weeks',
    features: ['Appointments', 'Telemedicine', 'Secure records', 'HIPAA compliant']
  },
  {
    slug: 'fintech-dashboard',
    title: 'FinTech Dashboard',
    client: 'DataVault Systems',
    category: 'Data & Analytics',
    industry: 'FinTech',
    heroImage: '/images/fintech-dashboard.jpg',
    problem: 'Analysts needed real time market data across multiple exchanges simultaneously.',
    solution: 'Built a real time dashboard with live market streams and portfolio tracking.',
    metrics: [
      { label: 'Data Latency', value: '<100ms' },
      { label: 'Exchanges Connected', value: '5' },
      { label: 'Custom Reports', value: '50+' },
      { label: 'User Adoption', value: '100%' }
    ],
    tech: ['Next.js', 'WebSocket', 'D3.js', 'Node.js', 'Redis'],
    testimonial: {
      quote: "The dashboard gives us a competitive edge. Real time data at our fingertips.",
      author: 'David Okafor',
      role: 'CTO, DataVault Systems'
    },
    timeline: '10 weeks',
    features: ['Live data', 'Portfolio tracking', 'Custom charts', 'Reports']
  },
  {
    slug: 'delivery-mobile-app',
    title: 'Delivery Mobile App',
    client: 'SwiftDeliver',
    category: 'Mobile Applications',
    industry: 'Logistics',
    heroImage: '/images/delivery-mobile-app.jpg',
    problem: 'Manual dispatch system caused delays and poor customer experience.',
    solution: 'Built a cross platform delivery app with real time tracking and notifications.',
    metrics: [
      { label: 'App Rating', value: '4.8' },
      { label: 'Delivery Time Reduced', value: '35%' },
      { label: 'Active Drivers', value: '500+' },
      { label: 'Customer Satisfaction', value: '92%' }
    ],
    tech: ['React Native', 'Firebase', 'Google Maps API', 'Node.js', 'MongoDB'],
    testimonial: {
      quote: "Our operations are now fully automated. Customers love the live tracking.",
      author: 'James Okonkwo',
      role: 'Founder, SwiftDeliver'
    },
    timeline: '8 weeks',
    features: ['Live tracking', 'Push notifications', 'Driver dashboard', 'Wallet']
  },
  {
    slug: 'ai-content-generator',
    title: 'AI Content Generator',
    client: 'ContentPro',
    category: 'AI Solutions',
    industry: 'Technology',
    heroImage: '/images/ai-content-generator.jpg',
    problem: 'Content team struggled to scale production while maintaining quality.',
    solution: 'Built an AI powered platform with team collaboration and brand voice control.',
    metrics: [
      { label: 'Content Output', value: '1M+/month' },
      { label: 'Time Saved', value: '70%' },
      { label: 'SEO Score', value: '90+' },
      { label: 'Team Adoption', value: '100%' }
    ],
    tech: ['Python', 'OpenAI API', 'Next.js', 'PostgreSQL', 'LangChain'],
    testimonial: {
      quote: "The AI platform transformed our operation. We now produce 10x more content.",
      author: 'Grace Okonkwo',
      role: 'CEO, ContentPro'
    },
    timeline: '10 weeks',
    features: ['GPT integration', 'Team collaboration', 'SEO optimization', 'Brand voice']
  }
]

const categories = ['All', 'Trading Systems', 'E-Commerce', 'SaaS Platforms', 'Data & Analytics', 'Mobile Applications', 'AI Solutions']
const industries = ['All Industries', 'FinTech', 'Healthcare', 'Retail', 'Logistics', 'Technology']

export default function WorkPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [industryFilter, setIndustryFilter] = useState('All Industries')

  const filteredProjects = projects.filter(p => {
    const matchesCategory = activeFilter === 'All' || p.category === activeFilter
    const matchesIndustry = industryFilter === 'All Industries' || p.industry === industryFilter
    return matchesCategory && matchesIndustry
  })

  const featuredProject = projects[0]
  const remainingProjects = filteredProjects.filter(p => p.slug !== featuredProject.slug)

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* HERO */}
      <section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/about-hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-indigo-950/85 to-black/90" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">Our Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Software Built to Solve Real Business Challenges</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">Explore selected software products, platforms, applications, and digital solutions developed by Omnix Lab for businesses across different industries.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start Your Project</Link>
            <a href="#portfolio" className="inline-flex px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl">Explore Our Work</a>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-6 lg:px-8 py-12 border-y border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-6">Selected Work Across Multiple Industries</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['FinTech', 'Healthcare', 'E-Commerce', 'Logistics', 'SaaS', 'AI', 'Trading', 'Business Operations'].map(industry => (
              <span key={industry} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-full">{industry}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CASE STUDY */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured Case Study</h2>
          <Link href={`/work/${featuredProject.slug}`} className="group block bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all">
            <div className="grid lg:grid-cols-2">
              <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
                <img src={featuredProject.heroImage} alt={featuredProject.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Featured</span>
                  <span className="text-gray-400 text-sm">{featuredProject.industry} • {featuredProject.category}</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">{featuredProject.title}</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-semibold text-blue-400">The Challenge</p>
                    <p className="text-gray-300 text-sm">{featuredProject.problem}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-400">The Solution</p>
                    <p className="text-gray-300 text-sm">{featuredProject.solution}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredProject.tech.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/10">{tech}</span>
                  ))}
                </div>
                <span className="inline-flex text-blue-400 font-medium group-hover:underline">View Case Study →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Explore Our Work</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-10">
            {industries.map(ind => (
              <button key={ind} onClick={() => setIndustryFilter(ind)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${industryFilter === ind ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>{ind}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingProjects.map((project) => (
              <Link key={project.slug} href={`/work/${project.slug}`} className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all block">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">{project.industry} • {project.category}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{project.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.problem}</p>
                  <span className="inline-flex items-center gap-1 text-blue-400 font-medium text-sm group-hover:underline">View Case Study →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY EXPERTISE */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Technology Expertise</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Supabase', 'Python', 'CCXT', 'WebSocket', 'D3.js', 'Stripe', 'Paystack', 'AWS', 'Firebase', 'React Native', 'OpenAI API', 'LangChain', 'MongoDB', 'Redis'].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT RESULTS */}
      <section className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Client Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ['50+', 'Projects Delivered'],
              ['99%', 'Client Satisfaction'],
              ['10+', 'Countries Served'],
              ['24/7', 'Automated Monitoring'],
            ].map(([num, label]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-4xl font-bold text-blue-400">{num}</p>
                <p className="text-gray-300 mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT TESTIMONIALS */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Client Testimonials</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((project) => (
              <div key={project.slug} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-300 italic mb-4">{project.testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold">{project.testimonial.author.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-white">{project.testimonial.author}</p>
                    <p className="text-gray-400 text-sm">{project.testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Have a Product in Mind?</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Tell us what you are building, what you are trying to improve, or the problem you are trying to solve. Our team can help turn the idea into a reliable software solution.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start Your Project →</Link>
            <Link href="/contact" className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10">Contact Omnix Lab</Link>
          </div>
        </div>
      </section>
    </div>
  )
}