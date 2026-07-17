import Link from 'next/link'

const projects = [
  {
    title: 'Crypto Trading Platform',
    category: 'Trading Bot',
    desc: 'Automated trading system with real-time analytics and risk management dashboard. High-frequency execution engine processing 10,000+ trades per second.',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '📈',
    features: ['Real-time analytics', 'Risk management', 'Multi-exchange', 'Backtesting engine']
  },
  {
    title: 'E-Commerce Platform',
    category: 'Web Development',
    desc: 'Full-featured online store with inventory management, payment processing, and customer analytics. Supporting 50,000+ products and 100,000+ daily visitors.',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🛒',
    features: ['Payment integration', 'Inventory system', 'Analytics dashboard', 'Mobile-first design']
  },
  {
    title: 'Healthcare SaaS',
    category: 'Software Development',
    desc: 'Patient management system with appointment scheduling, telemedicine features, and secure medical records. HIPAA-compliant architecture.',
    gradient: 'from-purple-500 to-pink-600',
    icon: '🏥',
    features: ['Appointment system', 'Telemedicine', 'Secure records', 'HIPAA compliant']
  },
  {
    title: 'FinTech Dashboard',
    category: 'Web Development',
    desc: 'Real-time financial data visualization and portfolio management interface. Live market data streams with sub-second latency.',
    gradient: 'from-violet-500 to-purple-600',
    icon: '💹',
    features: ['Live data streams', 'Portfolio tracking', 'Custom charts', 'Export reports']
  },
  {
    title: 'Delivery Mobile App',
    category: 'Mobile Development',
    desc: 'Cross-platform delivery app with real-time tracking, driver management, and customer notifications. 4.8★ rating on App Store & Play Store.',
    gradient: 'from-orange-500 to-red-500',
    icon: '📱',
    features: ['Live tracking', 'Push notifications', 'Driver dashboard', 'Payment wallet']
  },
  {
    title: 'AI Content Generator',
    category: 'AI & Automation',
    desc: 'Content creation platform powered by advanced language models with team collaboration. Generating 1M+ articles per month for enterprise clients.',
    gradient: 'from-cyan-500 to-blue-600',
    icon: '🤖',
    features: ['GPT integration', 'Team collaboration', 'SEO optimization', 'Brand voice control']
  },
]

export default function WorkPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Our Work</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A selection of projects we&apos;ve delivered for clients worldwide. 
            Each project represents our commitment to excellence and innovation.
          </p>
        </div>

        {/* Featured Project - Large */}
        <div className="mb-20">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer">
            {/* Visual */}
            <div className="aspect-[21/9] bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
              
              {/* Abstract financial grid */}
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

              {/* Trading chart lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,200 C50,180 100,150 150,170 C200,190 250,100 300,80 C350,60 400,120 450,90 C500,60 550,40 600,50 C650,60 700,20 800,30" 
                  fill="none" 
                  stroke="url(#lineGrad)" 
                  strokeWidth="3"
                  opacity="0.8"
                />
                <path 
                  d="M0,220 C50,210 100,190 150,195 C200,200 250,150 300,140 C350,130 400,160 450,140 C500,120 550,100 600,110 C650,120 700,80 800,90" 
                  fill="none" 
                  stroke="url(#lineGrad)" 
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              </svg>

              {/* Content overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
              
              {/* Text content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">Featured</span>
                  <span className="text-gray-300 text-sm">Trading Bot Development</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">Crypto Trading Platform</h2>
                <p className="text-gray-300 max-w-2xl">
                  Automated trading system with real-time analytics and risk management dashboard. 
                  High-frequency execution engine processing 10,000+ trades per second.
                </p>
                <Link 
                  href="/contact" 
                  className="inline-flex mt-4 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-200 transition-colors"
                >
                  Discuss a similar project →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {projects.slice(1).map((project, i) => (
            <div key={i} className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
              
              {/* Project Visual */}
              <div className={`aspect-[4/3] bg-gradient-to-br ${project.gradient} relative overflow-hidden`}>
                
                {/* Abstract patterns */}
                <div className="absolute inset-0 opacity-20">
                  {project.category === 'Web Development' && (
                    <svg className="w-full h-full" viewBox="0 0 200 150">
                      <rect x="20" y="20" width="160" height="15" rx="3" fill="white"/>
                      <rect x="20" y="45" width="120" height="10" rx="2" fill="white" opacity="0.7"/>
                      <rect x="20" y="65" width="100" height="10" rx="2" fill="white" opacity="0.5"/>
                      <rect x="20" y="85" width="140" height="8" rx="2" fill="white" opacity="0.4"/>
                      <circle cx="180" cy="30" r="15" fill="white" opacity="0.3"/>
                    </svg>
                  )}
                  {project.category === 'Software Development' && (
                    <svg className="w-full h-full" viewBox="0 0 200 150">
                      <rect x="10" y="10" width="85" height="60" rx="8" fill="white" opacity="0.3"/>
                      <rect x="105" y="10" width="85" height="60" rx="8" fill="white" opacity="0.2"/>
                      <rect x="10" y="80" width="85" height="60" rx="8" fill="white" opacity="0.2"/>
                      <rect x="105" y="80" width="85" height="60" rx="8" fill="white" opacity="0.3"/>
                    </svg>
                  )}
                  {project.category === 'Mobile Development' && (
                    <svg className="w-full h-full" viewBox="0 0 200 150">
                      <rect x="60" y="10" width="80" height="130" rx="12" fill="white" opacity="0.3"/>
                      <rect x="68" y="25" width="64" height="8" rx="2" fill="white" opacity="0.5"/>
                      <rect x="68" y="40" width="50" height="6" rx="2" fill="white" opacity="0.3"/>
                      <circle cx="100" cy="80" r="20" fill="white" opacity="0.2"/>
                    </svg>
                  )}
                  {project.category === 'AI & Automation' && (
                    <svg className="w-full h-full" viewBox="0 0 200 150">
                      <circle cx="100" cy="60" r="30" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                      <circle cx="100" cy="60" r="20" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                      <circle cx="100" cy="60" r="10" fill="white" opacity="0.2"/>
                      <line x1="70" y1="60" x2="130" y2="60" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                      <line x1="100" y1="30" x2="100" y2="90" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">{project.icon}</span>
                </div>

                {/* Category tag */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-3">{project.desc}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.features.map((feature, j) => (
                    <span key={j} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                      {feature}
                    </span>
                  ))}
                </div>

                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm hover:text-indigo-700 transition-colors"
                >
                  Inquire about this →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 lg:p-14 text-white">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">Have a project in mind?</h2>
            <p className="text-indigo-100 mb-8">
              Let&apos;s discuss how we can bring your vision to life with the same attention to detail and quality.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Start a conversation →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}