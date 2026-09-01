import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Software Solutions & Development Services | Omnix Lab',
  description:
    'Omnix Lab provides custom software development, SaaS platforms, AI solutions, trading systems, mobile apps, web applications, e-commerce and API integrations for businesses worldwide.',
  keywords: [
    'software development services',
    'custom software development',
    'SaaS development',
    'web application development',
    'mobile app development',
    'AI solutions',
    'trading bot development',
    'e-commerce development',
    'API integration',
    'business automation',
    'Omnix Lab',
  ],
  openGraph: {
    title: 'Software Solutions & Development Services | Omnix Lab',
    description:
      'Explore Omnix Lab software services: custom software, SaaS, AI, trading systems, mobile apps, web apps, e-commerce and API integrations.',
    type: 'website',
  },
}

const serviceNav = [
  { id: 'custom-software', label: 'Custom Software' },
  { id: 'web-applications', label: 'Web Applications' },
  { id: 'saas', label: 'SaaS' },
  { id: 'ai-solutions', label: 'AI Solutions' },
  { id: 'trading-systems', label: 'Trading Systems' },
  { id: 'mobile', label: 'Mobile Apps' },
  { id: 'ecommerce', label: 'E-Commerce' },
  { id: 'integrations', label: 'Integrations' },
]

const services = [
  {
    id: 'custom-software',
    number: '01',
    title: 'Custom Software Development',
    tagline: 'Software designed around your business processes.',
    description: 'Replace fragmented workflows and disconnected tools with software built around how your business actually operates.',
    problems: ['Manual workflows', 'Disconnected systems', 'Repetitive operations', 'Outdated software', 'Fragmented data', 'Limited reporting'],
    capabilities: ['Business management platforms', 'Workflow systems', 'Operational dashboards', 'Customer portals', 'Internal tools', 'Automation platforms'],
    useCases: ['Business platforms', 'Internal systems', 'Workflow automation', 'Customer portals'],
    cta: 'Discuss Your Software Project',
  },
  {
    id: 'web-applications',
    number: '02',
    title: 'Web Application Development',
    tagline: 'Sophisticated browser-based products.',
    description: 'High-performance web platforms with secure authentication, dashboards, payment systems, and real-time functionality.',
    problems: ['Complex user flows', 'Legacy systems', 'Performance issues', 'Limited scalability'],
    capabilities: ['Responsive interfaces', 'Authentication systems', 'Role-based dashboards', 'Payment integrations', 'API integrations', 'Real-time features', 'Analytics'],
    useCases: ['Business platforms', 'Customer portals', 'Marketplaces', 'Financial applications'],
    cta: 'Build a Web Application',
  },
  {
    id: 'saas',
    number: '03',
    title: 'SaaS Product Development',
    tagline: 'From product idea to scalable SaaS.',
    description: 'Multi-tenant subscription platforms with user management, billing, permissions, analytics, and notifications.',
    problems: ['Manual billing', 'No user management', 'Limited reporting', 'No subscription system'],
    capabilities: ['User accounts', 'Organizations', 'Subscriptions', 'Billing systems', 'Usage tracking', 'Roles and permissions', 'Admin dashboards', 'Analytics', 'Notifications', 'Integrations'],
    useCases: ['SaaS platforms', 'Subscription products', 'Multi-tenant systems', 'B2B software'],
    cta: 'Build Your SaaS',
  },
  {
    id: 'ai-solutions',
    number: '04',
    title: 'AI Solutions & Automation',
    tagline: 'Turn AI into a product, not just a feature.',
    description: 'Intelligent systems using AI assistants, document processing, content automation, and business intelligence.',
    problems: ['Manual data processing', 'No intelligent automation', 'Unstructured data', 'Scaling content'],
    capabilities: ['AI assistants', 'Automation workflows', 'Document intelligence', 'Content systems', 'Data processing', 'Recommendation systems', 'AI SaaS', 'Business intelligence'],
    useCases: ['AI assistants', 'Automation platforms', 'Document processing', 'Content systems'],
    cta: 'Explore AI Solutions',
  },
  {
    id: 'trading-systems',
    number: '05',
    title: 'Trading Systems & Bots',
    tagline: 'Automated trading systems built around your strategy.',
    description: 'Crypto, forex, and stock trading bots with strategy automation, backtesting, real-time market data, and risk controls.',
    problems: ['Manual trading errors', 'Missed opportunities', 'No automation', 'Limited strategy tools'],
    capabilities: ['Crypto trading bots', 'Forex trading bots', 'Stock trading systems', 'Arbitrage systems', 'Market-making systems', 'Strategy automation', 'Real-time market data', 'Portfolio monitoring', 'Backtesting', 'Risk controls', 'Exchange integrations'],
    useCases: ['Trading bots', 'Arbitrage', 'Market making', 'Portfolio automation'],
    cta: 'Discuss a Trading System',
  },
  {
    id: 'mobile',
    number: '06',
    title: 'Mobile Application Development',
    tagline: 'Mobile products your customers can depend on.',
    description: 'Native iOS, Android, and cross-platform applications with notifications, payments, booking, and offline support.',
    problems: ['Poor mobile experience', 'No customer app', 'Limited device reach', 'Manual processes'],
    capabilities: ['iOS', 'Android', 'Cross-platform', 'Customer applications', 'Internal applications', 'Booking applications', 'Commerce applications', 'Mobile dashboards'],
    useCases: ['Customer apps', 'Internal tools', 'Booking systems', 'Commerce apps'],
    cta: 'Build a Mobile App',
  },
  {
    id: 'ecommerce',
    number: '07',
    title: 'E-Commerce Solutions',
    tagline: 'Commerce experiences built for growth.',
    description: 'Custom stores, marketplaces, inventory management, checkout, payment integrations, and analytics.',
    problems: ['Limited store features', 'No payment integration', 'Poor mobile checkout', 'Manual inventory'],
    capabilities: ['Custom storefronts', 'Marketplaces', 'Product management', 'Inventory systems', 'Checkout flows', 'Payment integrations', 'Order management', 'Customer accounts', 'Analytics'],
    useCases: ['Online stores', 'Marketplaces', 'B2B commerce', 'Subscription commerce'],
    cta: 'Start an E-Commerce Project',
  },
  {
    id: 'integrations',
    number: '08',
    title: 'API & Systems Integration',
    tagline: 'Connect the tools your business already uses.',
    description: 'Integrate payment gateways, CRM, ERP, communication platforms, and external APIs into a unified system.',
    problems: ['Disconnected tools', 'Manual data entry', 'No central system', 'Integration gaps'],
    capabilities: ['Third-party APIs', 'Payment gateways', 'CRM integrations', 'ERP integrations', 'Communication platforms', 'Financial APIs', 'Authentication providers', 'Automation services'],
    useCases: ['API platforms', 'System integrations', 'Payment systems', 'Data synchronization'],
    cta: 'Connect Your Systems',
  },
]

const processSteps = [
  { step: '01', title: 'Discovery', description: 'Understand the business, users and objectives.' },
  { step: '02', title: 'Product Planning', description: 'Define features, workflows and priorities.' },
  { step: '03', title: 'UX/UI', description: 'Design the product experience.' },
  { step: '04', title: 'Development', description: 'Build the application and supporting systems.' },
  { step: '05', title: 'Testing', description: 'Validate functionality, performance and usability.' },
  { step: '06', title: 'Launch', description: 'Deploy the product into production.' },
  { step: '07', title: 'Continuous Improvement', description: 'Maintain, optimize and expand the product.' },
]

const audiences = [
  { title: 'Startups', description: 'Turn ideas into launch-ready digital products.' },
  { title: 'Growing Businesses', description: 'Replace manual processes and disconnected tools.' },
  { title: 'Established Companies', description: 'Modernize systems and improve operational efficiency.' },
  { title: 'Product Companies', description: 'Extend development capacity and launch new products.' },
]

const projectTypes = [
  'Customer Portals', 'Admin Platforms', 'SaaS Products', 'Mobile Applications',
  'Dashboards', 'Marketplaces', 'Automation Systems', 'Trading Platforms',
  'AI Products', 'E-Commerce Platforms', 'Internal Business Systems', 'API Platforms',
]

const techCategories = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript'] },
  { category: 'Backend', items: ['Node.js', 'APIs', 'Databases'] },
  { category: 'Cloud & Infrastructure', items: ['Cloud platforms', 'Deployment systems', 'Monitoring'] },
  { category: 'Data', items: ['PostgreSQL', 'Supabase', 'Analytics systems'] },
  { category: 'Payments', items: ['Paystack', 'Flutterwave', 'Stripe', 'Other providers'] },
  { category: 'AI', items: ['LLM APIs', 'AI automation', 'Machine intelligence systems'] },
]

const workProof = [
  { title: 'Crypto Trading Platform', industry: 'FinTech', outcome: 'Automated trading with real-time risk management.', image: '/images/trading-platform.jpg', link: '/work/crypto-trading-platform' },
  { title: 'Healthcare SaaS Platform', industry: 'Healthcare', outcome: 'Centralized patient management with telemedicine.', image: '/images/healthcare-saas.jpg', link: '/work/healthcare-saas' },
  { title: 'AI Content Generator', industry: 'AI & Automation', outcome: '10x content output with brand voice control.', image: '/images/ai-content-generator.jpg', link: '/work/ai-content-generator' },
]

const faqs = [
  { q: 'What types of software does Omnix Lab build?', a: 'We build custom software, web applications, SaaS platforms, mobile apps, AI solutions, trading systems, e-commerce platforms and API integrations.' },
  { q: 'Can you build a product from an idea?', a: 'Yes. We work with you from discovery and planning through launch and continuous improvement.' },
  { q: 'Can you work with an existing application?', a: 'Absolutely. We can audit, modernize, extend, or take over development of an existing codebase.' },
  { q: 'Do you provide UI/UX design?', a: 'Yes, we include UX/UI design as part of every product development project.' },
  { q: 'Can you integrate payment gateways?', a: 'Yes, we integrate Paystack, Flutterwave, Stripe and other payment providers as required.' },
  { q: 'Can you integrate third-party APIs?', a: 'Yes, we integrate CRM, ERP, communication platforms, financial APIs, authentication providers and automation services.' },
  { q: 'Do you build SaaS platforms?', a: 'Yes, we build multi-tenant SaaS products with billing, subscriptions, permissions, dashboards and analytics.' },
  { q: 'Do you develop mobile applications?', a: 'Yes, we develop native iOS, Android, and cross-platform mobile applications.' },
  { q: 'Do you build AI-powered applications?', a: 'Yes, we build AI assistants, automation workflows, document intelligence, recommendation systems and AI SaaS products.' },
  { q: 'Do you develop trading systems?', a: 'Yes, we develop trading bots, arbitrage systems, market-making systems and portfolio automation tools.' },
  { q: 'How long does development take?', a: 'Timelines depend on complexity. Most projects range from 6 to 12 weeks. We provide a detailed estimate after discovery.' },
  { q: 'How much does software development cost?', a: 'Costs vary based on functionality and scope. We provide a project scope and investment estimate after understanding your requirements.' },
  { q: 'Do you provide post-launch support?', a: 'Yes, we offer ongoing maintenance, monitoring, feature updates and technical support.' },
  { q: 'Can you work with international clients?', a: 'Absolutely. We work with clients worldwide using remote-first collaboration.' },
  { q: 'How do we start a project?', a: 'Contact us through the form on this page. We will schedule a discovery call to understand your objectives.' },
]

export default function ServicesPage() {
  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* HERO */}
      <section className="relative pt-36 pb-24 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('/images/services-hero.jpg')" }} />
<div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-950/60 to-gray-950/90" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">What We Build</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Software Solutions Built Around Your Business</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-10">From intelligent automation and SaaS platforms to web applications, mobile products and trading systems, Omnix Lab develops digital solutions designed around real business requirements.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start Your Project</Link>
            <Link href="/work" className="inline-flex px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl">Explore Our Work</Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
            <span>Software Development</span><span>•</span><span>SaaS</span><span>•</span><span>AI</span><span>•</span><span>Trading</span><span>•</span><span>Mobile</span><span>•</span><span>Web</span>
          </div>
        </div>
      </section>

      {/* STICKY SERVICE NAVIGATION */}
      <section className="sticky top-16 z-40 bg-gray-950/80 backdrop-blur-xl border-y border-white/10 px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2">
          {serviceNav.map((nav) => (
            <a key={nav.id} href={`#${nav.id}`} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-full hover:bg-white/10 whitespace-nowrap transition-colors">
              {nav.label}
            </a>
          ))}
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Solutions for the Entire Digital Product Lifecycle</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">Whether you are starting with an idea, replacing outdated software or expanding an existing platform, Omnix Lab provides the capabilities required to take your product from concept to production.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <a key={service.id} href={`#${service.id}`} className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <span className="text-blue-400 font-bold text-sm">{service.number}</span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2 group-hover:text-blue-400">{service.title}</h3>
                <p className="text-gray-400 text-sm">{service.tagline}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED SERVICE SECTIONS */}
      {services.map((service, index) => (
        <section key={service.id} id={service.id} className={`py-20 lg:py-28 px-6 lg:px-8 ${index % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/50 border-t border-white/10'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="lg:w-1/3">
                <span className="text-5xl font-bold text-blue-400/30">{service.number}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-3">{service.title}</h2>
                <p className="text-gray-400 mb-6">{service.description}</p>
                <Link href="/contact" className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">{service.cta}</Link>
              </div>
              <div className="lg:w-2/3 space-y-8">
                <div>
                  <h3 className="font-bold text-white mb-3">Problems We Solve</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.problems.map((p, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-red-500/10 text-red-300 rounded-full text-sm border border-red-500/20">{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-3">What We Build</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {service.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-3">Use Cases</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.useCases.map((uc, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 rounded-full text-sm border border-blue-500/20">{uc}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* TECHNOLOGY CAPABILITIES */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Modern Technology. Serious Development.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {techCategories.map((cat) => (
              <div key={cat.category} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-white mb-4">{cat.category}</h3>
                <ul className="space-y-2 text-gray-400 text-sm">{cat.items.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE DELIVER */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">From Idea to Production</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <span className="text-2xl font-bold text-blue-400">{step.step}</span>
                <h3 className="font-semibold text-white mt-2">{step.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE WORK WITH */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Different Stages of Business</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {audiences.map((aud) => (
              <div key={aud.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-2">{aud.title}</h3>
                <p className="text-gray-400 text-sm">{aud.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE CAN BUILD */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Can We Build?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {projectTypes.map((type) => (
              <span key={type} className="px-5 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">{type}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WORK PROOF */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">See What These Capabilities Look Like in Practice</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {workProof.map((work) => (
              <Link key={work.title} href={work.link} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all">
                <img src={work.image} alt={work.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="p-6">
                  <p className="text-sm text-blue-400">{work.industry}</p>
                  <h3 className="font-bold text-white mt-1 mb-2">{work.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{work.outcome}</p>
                  <span className="text-blue-400 text-sm">View Case Study →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/work" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">View All Work</Link>
          </div>
        </div>
      </section>

      {/* ENTERPRISE CAPABILITIES */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Serious Digital Operations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['Security', 'Authentication, permissions and secure application practices.'],
              ['Scalability', 'Systems designed to support changing business requirements.'],
              ['Performance', 'Fast interfaces and optimized application experiences.'],
              ['Reliability', 'Monitoring, error handling and resilient application behavior.'],
              ['Integrations', 'Connect your software ecosystem.'],
              ['Analytics', 'Turn product and business data into useful insights.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Security by Design</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {['Authentication', 'Authorization', 'Role-based permissions', 'Secure API handling', 'Encrypted connections', 'Protected environment variables', 'Database security', 'Audit logging where required', 'Secure payment integrations', 'Session management'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT & MAINTENANCE */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Launch Is Not the End</h2>
          <p className="text-gray-400 mb-8">We provide ongoing maintenance, monitoring, feature updates, security patches, infrastructure management and technical support.</p>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Discuss Ongoing Support</Link>
        </div>
      </section>

      {/* PRICING / INVESTMENT */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Project Investment</h2>
          <p className="text-gray-400 mb-8">Every product has different requirements. After understanding your objectives, functionality and technical requirements, we provide a project scope and investment estimate.</p>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Request a Project Estimate</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
                  <span className="font-medium text-white">{faq.q}</span>
                  <span className="text-blue-400 group-open:hidden">+</span>
                  <span className="text-blue-400 hidden group-open:inline">−</span>
                </summary>
                <div className="px-6 pb-4 text-gray-400 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Let&apos;s Build Something That Moves Your Business Forward</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Tell us what you&apos;re trying to build, improve or automate. We&apos;ll help you determine the right software approach and next steps.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start Your Project →</Link>
            <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10">Talk to Omnix Lab</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
