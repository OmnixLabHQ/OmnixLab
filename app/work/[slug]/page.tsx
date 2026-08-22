import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
}

const projects: Project[] = [
  {
    slug: 'crypto-trading-platform',
    title: 'Crypto Trading Platform',
    client: 'FinEdge Capital',
    category: 'Trading Bot',
    heroImage: '📈',
    problem: 'Manual trading caused missed opportunities and inconsistent profits in volatile crypto markets. The client needed 24/7 automated execution.',
    solution: 'Built a high-frequency trading bot with real-time market analysis, automated execution, and risk management dashboard.',
    metrics: [
      { label: 'Execution Speed', value: '0.003ms' },
      { label: 'Monthly Return', value: '18%' },
      { label: 'Uptime', value: '99.9%' },
      { label: 'Trades/Month', value: '10,000+' }
    ],
    tech: ['Python', 'CCXT', 'PostgreSQL', 'WebSocket', 'AWS'],
    testimonial: {
      quote: "Omnix Lab's trading bot has been a game-changer for our firm. Consistent returns with zero manual intervention.",
      author: 'Michael Chen',
      role: 'CEO, FinEdge Capital'
    },
    timeline: '8 weeks'
  },
  {
    slug: 'ecommerce-platform',
    title: 'E-Commerce Platform',
    client: 'CloudStack Solutions',
    category: 'Web Development',
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
    timeline: '6 weeks'
  },
  {
    slug: 'healthcare-saas',
    title: 'Healthcare SaaS',
    client: 'MediCare Plus',
    category: 'Software Development',
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
      quote: "Omnix Lab built exactly what we needed. Our operations are now streamlined and our patients love the telemedicine feature.",
      author: 'Dr. Amina Yusuf',
      role: 'CEO, MediCare Plus'
    },
    timeline: '12 weeks'
  },
  {
    slug: 'fintech-dashboard',
    title: 'FinTech Dashboard',
    client: 'DataVault Systems',
    category: 'Web Development',
    heroImage: '💹',
    problem: 'Financial analysts needed a real-time dashboard to monitor market data across multiple exchanges simultaneously.',
    solution: 'Built a real-time data visualization dashboard with live market streams, portfolio tracking, and custom reporting.',
    metrics: [
      { label: 'Data Latency', value: '<100ms' },
      { label: 'Exchanges Connected', value: '5' },
      { label: 'Custom Reports', value: '50+' },
      { label: 'User Adoption', value: '100%' }
    ],
    tech: ['Next.js', 'WebSocket', 'D3.js', 'Node.js', 'Redis'],
    testimonial: {
      quote: "The dashboard Omnix Lab built gives us a competitive edge. Real-time data at our fingertips.",
      author: 'David Okafor',
      role: 'CTO, DataVault Systems'
    },
    timeline: '10 weeks'
  },
  {
    slug: 'delivery-mobile-app',
    title: 'Delivery Mobile App',
    client: 'SwiftDeliver',
    category: 'Mobile Development',
    heroImage: '📱',
    problem: 'Manual dispatch system caused delays and poor customer experience with no real-time tracking.',
    solution: 'Built a cross-platform delivery app with real-time tracking, driver management, and push notifications.',
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
    timeline: '8 weeks'
  },
  {
    slug: 'ai-content-generator',
    title: 'AI Content Generator',
    client: 'ContentPro',
    category: 'AI & Automation',
    heroImage: '🤖',
    problem: 'Content team struggled to scale production while maintaining quality and brand voice consistency.',
    solution: 'Built an AI-powered content generation platform with team collaboration, SEO optimization, and brand voice control.',
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
    timeline: '10 weeks'
  }
]

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = projects.find(p => p.slug === params.slug)
  if (!project) return { title: 'Project Not Found' }
  return {
    title: `${project.title} | Omnix Lab Case Study`,
    description: `Omnix Lab built ${project.title} for ${project.client}. ${project.solution.substring(0, 100)}...`,
  }
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = projects.find(p => p.slug === params.slug)
  if (!project) notFound()

  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/work" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-8 inline-block">
          ← Back to Portfolio
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
              {project.category}
            </span>
            <span className="text-sm text-gray-400">Timeline: {project.timeline}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">{project.title}</h1>
          <p className="text-xl text-gray-500">Client: {project.client}</p>
        </div>

        {/* Problem & Solution */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h3 className="text-lg font-bold text-red-700 mb-2">🔴 The Problem</h3>
            <p className="text-gray-700 leading-relaxed">{project.problem}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-bold text-green-700 mb-2">🟢 The Solution</h3>
            <p className="text-gray-700 leading-relaxed">{project.solution}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Key Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.metrics.map((metric, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 text-center border border-gray-100">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-1">{metric.value}</div>
                <div className="text-xs text-gray-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🛠️ Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech, i) => (
              <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <div className="text-4xl mb-4">"</div>
          <p className="text-lg leading-relaxed mb-4 italic">{project.testimonial.quote}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {project.testimonial.author.charAt(0)}
            </div>
            <div>
              <p className="font-bold">{project.testimonial.author}</p>
              <p className="text-indigo-200 text-sm">{project.testimonial.role}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Ready for similar results?</h3>
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Start Your Project →
          </Link>
        </div>
      </div>
    </div>
  )
}