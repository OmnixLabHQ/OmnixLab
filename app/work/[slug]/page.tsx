import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Project {
  slug: string
  title: string
  client: string
  category: string
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
      quote: "Omnix Lab's trading bot has been a game changer for our firm.",
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
    problem: 'Outdated platform could not handle growing traffic.',
    solution: 'Developed a modern e-commerce platform with inventory and payments.',
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
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🛒',
    features: ['Payment integration', 'Inventory system', 'Analytics', 'Mobile first']
  },
  {
    slug: 'healthcare-saas',
    title: 'Healthcare SaaS Platform',
    client: 'MediCare Plus',
    category: 'SaaS Platforms',
    problem: 'Patient data was scattered across multiple systems.',
    solution: 'Created a centralized patient management system with telemedicine.',
    metrics: [
      { label: 'Scheduling Time Reduced', value: '80%' },
      { label: 'Patients Onboarded', value: '10,000+' },
      { label: 'Compliance', value: 'HIPAA' },
      { label: 'Patient Satisfaction', value: '95%' }
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'WebRTC', 'AWS'],
    testimonial: {
      quote: "Omnix Lab built exactly what we needed.",
      author: 'Dr. Amina Yusuf',
      role: 'CEO, MediCare Plus'
    },
    timeline: '12 weeks',
    gradient: 'from-purple-500 to-pink-600',
    icon: '🏥',
    features: ['Appointments', 'Telemedicine', 'Secure records', 'HIPAA']
  },
  {
    slug: 'fintech-dashboard',
    title: 'FinTech Dashboard',
    client: 'DataVault Systems',
    category: 'Data & Analytics',
    problem: 'Analysts needed real time market data.',
    solution: 'Built a real time dashboard with live streams.',
    metrics: [
      { label: 'Data Latency', value: '<100ms' },
      { label: 'Exchanges Connected', value: '5' },
      { label: 'Custom Reports', value: '50+' },
      { label: 'User Adoption', value: '100%' }
    ],
    tech: ['Next.js', 'WebSocket', 'D3.js', 'Node.js', 'Redis'],
    testimonial: {
      quote: "The dashboard gives us a competitive edge.",
      author: 'David Okafor',
      role: 'CTO, DataVault Systems'
    },
    timeline: '10 weeks',
    gradient: 'from-violet-500 to-purple-600',
    icon: '💹',
    features: ['Live data', 'Portfolio', 'Charts', 'Reports']
  },
  {
    slug: 'delivery-mobile-app',
    title: 'Delivery Mobile App',
    client: 'SwiftDeliver',
    category: 'Mobile Applications',
    problem: 'Manual dispatch caused delays.',
    solution: 'Built a cross platform delivery app with tracking.',
    metrics: [
      { label: 'App Rating', value: '4.8' },
      { label: 'Delivery Time Reduced', value: '35%' },
      { label: 'Active Drivers', value: '500+' },
      { label: 'Customer Satisfaction', value: '92%' }
    ],
    tech: ['React Native', 'Firebase', 'Maps API', 'Node.js', 'MongoDB'],
    testimonial: {
      quote: "Our operations are now fully automated.",
      author: 'James Okonkwo',
      role: 'Founder, SwiftDeliver'
    },
    timeline: '8 weeks',
    gradient: 'from-orange-500 to-red-500',
    icon: '📱',
    features: ['Tracking', 'Notifications', 'Dashboard', 'Wallet']
  },
  {
    slug: 'ai-content-generator',
    title: 'AI Content Generator',
    client: 'ContentPro',
    category: 'AI Solutions',
    problem: 'Content team struggled to scale.',
    solution: 'Built an AI powered content platform.',
    metrics: [
      { label: 'Content Output', value: '1M+/month' },
      { label: 'Time Saved', value: '70%' },
      { label: 'SEO Score', value: '90+' },
      { label: 'Team Adoption', value: '100%' }
    ],
    tech: ['Python', 'OpenAI', 'Next.js', 'PostgreSQL'],
    testimonial: {
      quote: "The AI platform transformed our operation.",
      author: 'Grace Okonkwo',
      role: 'CEO, ContentPro'
    },
    timeline: '10 weeks',
    gradient: 'from-cyan-500 to-blue-600',
    icon: '🤖',
    features: ['GPT', 'Team', 'SEO', 'Voice']
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
    <div className="bg-gray-950 text-white min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/work" className="text-blue-400 hover:text-blue-300 font-medium text-sm mb-8 inline-block">
          ← Back to Portfolio
        </Link>

        <div className={`aspect-[21/9] bg-gradient-to-br ${project.gradient} rounded-3xl relative overflow-hidden mb-10 flex items-center justify-center`}>
          <span className="text-8xl">{project.icon}</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">{project.category}</span>
            <span className="text-sm text-gray-400">Timeline: {project.timeline}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{project.title}</h1>
          <p className="text-xl text-gray-400">Client: {project.client}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-2">The Problem</h3>
            <p className="text-gray-300 leading-relaxed">{project.problem}</p>
          </div>
          <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20">
            <h3 className="text-lg font-bold text-green-400 mb-2">The Solution</h3>
            <p className="text-gray-300 leading-relaxed">{project.solution}</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.metrics.map((metric, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">{metric.value}</div>
                <div className="text-xs text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech, i) => (
              <span key={i} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <p className="text-lg leading-relaxed mb-4 italic">{project.testimonial.quote}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {project.testimonial.author.charAt(0)}
            </div>
            <div>
              <p className="font-bold">{project.testimonial.author}</p>
              <p className="text-indigo-200 text-sm">{project.testimonial.role}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Ready for similar results?</h3>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
            Start Your Project →
          </Link>
        </div>
      </div>
    </div>
  )
}