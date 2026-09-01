export interface CaseStudy {
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
  type: 'case-study'
}

export interface VideoProject {
  slug: string
  name: string
  title: string
  category: string
  industry: string
  type: 'video'
  video: string
  poster: string
  description: string
}

export type WorkProject = CaseStudy | VideoProject

export const caseStudies: CaseStudy[] = [
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
    features: ['Real time analytics', 'Risk management', 'Multi exchange', 'Backtesting'],
    type: 'case-study'
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
    features: ['Payment integration', 'Inventory system', 'Analytics', 'Mobile first'],
    type: 'case-study'
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
    features: ['Appointments', 'Telemedicine', 'Secure records', 'HIPAA compliant'],
    type: 'case-study'
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
    features: ['Live data', 'Portfolio tracking', 'Custom charts', 'Reports'],
    type: 'case-study'
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
    features: ['Live tracking', 'Push notifications', 'Driver dashboard', 'Wallet'],
    type: 'case-study'
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
    features: ['GPT integration', 'Team collaboration', 'SEO optimization', 'Brand voice'],
    type: 'case-study'
  }
]

export const videoProjects: VideoProject[] = [
  {
    slug: 'drift',
    name: 'DRIFT',
    title: 'Coffee Ordering Website',
    category: 'Web Development',
    industry: 'Food & Beverage',
    type: 'video',
    video: '/videos/work/drift.mp4',
    poster: '/videos/work/drift.webp',
    description: 'A modern coffee ordering platform designed for a seamless digital experience.'
  },
  {
    slug: 'kineticpt',
    name: 'KINETICPT',
    title: 'Physiotherapy Website',
    category: 'Web Development',
    industry: 'Healthcare',
    type: 'video',
    video: '/videos/work/kineticpt.mp4',
    poster: '/videos/work/kineticpt.webp',
    description: 'A clean physiotherapy website focused on patient bookings and information.'
  },
  {
    slug: 'royal-trim',
    name: 'ROYAL TRIM',
    title: 'Premium Barbing Website',
    category: 'Web Development',
    industry: 'Lifestyle',
    type: 'video',
    video: '/videos/work/royal-trim.mp4',
    poster: '/videos/work/royal-trim.webp',
    description: 'A premium barbershop website with a bold visual identity.'
  },
  {
    slug: 'medcore',
    name: 'MEDCORE',
    title: 'Healthcare Website',
    category: 'Web Development',
    industry: 'Healthcare',
    type: 'video',
    video: '/videos/work/medcore.mp4',
    poster: '/videos/work/medcore.webp',
    description: 'A healthcare website built for clarity and patient trust.'
  },
  {
    slug: 'homepoint',
    name: 'HOMEPOINT',
    title: 'Real Estate Listing Platform',
    category: 'Web Development',
    industry: 'Real Estate',
    type: 'video',
    video: '/videos/work/homepoint.mp4',
    poster: '/videos/work/homepoint.webp',
    description: 'A real estate platform for house sales and listings with an intuitive search experience.'
  },
  {
    slug: 'omnix-ai',
    name: 'OMNIX AI',
    title: 'AI Customer Support Platform',
    category: 'AI & Automation',
    industry: 'Technology',
    type: 'video',
    video: '/videos/work/omnix-ai.mp4',
    poster: '/videos/work/omnix-ai.webp',
    description: 'AI-powered customer support designed to automate conversations and improve customer experience.'
  },
  {
    slug: 'aurion',
    name: 'AURION',
    title: 'Real Estate Digital Experience',
    category: 'Web Development',
    industry: 'Real Estate',
    type: 'video',
    video: '/videos/work/aurion.mp4',
    poster: '/videos/work/aurion.webp',
    description: 'A premium real estate digital experience with high-end visuals.'
  },
  {
    slug: 'aura-capital',
    name: 'AURA CAPITAL',
    title: 'AI Automation Platform',
    category: 'AI & Automation',
    industry: 'Finance',
    type: 'video',
    video: '/videos/work/aura-capital.mp4',
    poster: '/videos/work/aura-capital.webp',
    description: 'An AI automation platform built for modern financial operations.'
  },
  {
    slug: 'nexusgrid',
    name: 'NEXUSGRID',
    title: 'Web3 Digital Platform',
    category: 'Web3',
    industry: 'Technology',
    type: 'video',
    video: '/videos/work/nexusgrid.mp4',
    poster: '/videos/work/nexusgrid.webp',
    description: 'A Web3 digital platform with a focus on decentralized user experience.'
  }
]

export const allProjects: WorkProject[] = [...caseStudies, ...videoProjects]

export const portfolioCategories = [
  'All',
  'Web',
  'SaaS',
  'AI & Automation',
  'FinTech',
  'Trading',
  'Healthcare',
  'Real Estate',
  'Mobile',
  'Web3'
]