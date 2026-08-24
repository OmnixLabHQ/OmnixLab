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

const services = [
  {
    id: 'custom-software',
    number: '01',
    title: 'Custom Software Development',
    tagline: 'Software designed around your business processes.',
    description:
      'Replace fragmented workflows and disconnected tools with software built around how your business actually operates.',
    problems: [
      'Manual workflows',
      'Disconnected systems',
      'Repetitive operations',
      'Outdated software',
      'Fragmented data',
      'Limited reporting',
    ],
    capabilities: [
      'Business management platforms',
      'Workflow systems',
      'Operational dashboards',
      'Customer portals',
      'Internal tools',
      'Automation platforms',
    ],
    cta: 'Discuss Your Software Project',
    href: '/contact',
  },
  {
    id: 'web-applications',
    number: '02',
    title: 'Web Application Development',
    tagline: 'Sophisticated browser-based products.',
    description:
      'High-performance web platforms with secure authentication, dashboards, payment systems, and real-time functionality.',
    capabilities: [
      'Responsive interfaces',
      'Authentication systems',
      'Role-based dashboards',
      'Payment integrations',
      'API integrations',
      'Real-time features',
      'Analytics',
    ],
    cta: 'Build a Web Application',
    href: '/contact',
  },
  {
    id: 'saas',
    number: '03',
    title: 'SaaS Product Development',
    tagline: 'From product idea to scalable SaaS.',
    description:
      'Multi-tenant subscription platforms with user management, billing, permissions, analytics, and notifications.',
    capabilities: [
      'User accounts',
      'Organizations',
      'Subscriptions',
      'Billing systems',
      'Usage tracking',
      'Roles and permissions',
      'Admin dashboards',
      'Analytics',
      'Notifications',
      'Integrations',
    ],
    cta: 'Build Your SaaS',
    href: '/contact',
  },
  {
    id: 'ai-solutions',
    number: '04',
    title: 'AI Solutions & Automation',
    tagline: 'Turn AI into a product, not just a feature.',
    description:
      'Intelligent systems using AI assistants, document processing, content automation, and business intelligence.',
    capabilities: [
      'AI assistants',
      'Automation workflows',
      'Document intelligence',
      'Content systems',
      'Data processing',
      'Recommendation systems',
      'AI SaaS',
      'Business intelligence',
    ],
    cta: 'Explore AI Solutions',
    href: '/contact',
  },
  {
    id: 'trading-systems',
    number: '05',
    title: 'Trading Systems & Bots',
    tagline: 'Automated trading systems built around your strategy.',
    description:
      'Crypto, forex, and stock trading bots with strategy automation, backtesting, real-time market data, and risk controls.',
    capabilities: [
      'Crypto trading bots',
      'Forex trading bots',
      'Stock trading systems',
      'Arbitrage systems',
      'Market-making systems',
      'Strategy automation',
      'Real-time market data',
      'Portfolio monitoring',
      'Backtesting',
      'Risk controls',
      'Exchange integrations',
    ],
    cta: 'Discuss a Trading System',
    href: '/contact',
  },
  {
    id: 'mobile',
    number: '06',
    title: 'Mobile Application Development',
    tagline: 'Mobile products your customers can depend on.',
    description:
      'Native iOS, Android, and cross-platform applications with notifications, payments, booking, and offline support.',
    capabilities: [
      'iOS',
      'Android',
      'Cross-platform',
      'Customer applications',
      'Internal applications',
      'Booking applications',
      'Commerce applications',
      'Mobile dashboards',
    ],
    cta: 'Build a Mobile App',
    href: '/contact',
  },
  {
    id: 'ecommerce',
    number: '07',
    title: 'E-Commerce Solutions',
    tagline: 'Commerce experiences built for growth.',
    description:
      'Custom stores, marketplaces, inventory management, checkout, payment integrations, and analytics.',
    capabilities: [
      'Custom storefronts',
      'Marketplaces',
      'Product management',
      'Inventory systems',
      'Checkout flows',
      'Payment integrations',
      'Order management',
      'Customer accounts',
      'Analytics',
    ],
    cta: 'Start an E-Commerce Project',
    href: '/contact',
  },
  {
    id: 'integrations',
    number: '08',
    title: 'API & Systems Integration',
    tagline: 'Connect the tools your business already uses.',
    description:
      'Integrate payment gateways, CRM, ERP, communication platforms, and external APIs into a unified system.',
    capabilities: [
      'Third-party APIs',
      'Payment gateways',
      'CRM integrations',
      'ERP integrations',
      'Communication platforms',
      'Financial APIs',
      'Authentication providers',
      'Automation services',
    ],
    cta: 'Connect Your Systems',
    href: '/contact',
  },
]

const processSteps = [
  {
    step: '01',
    title: 'Discovery',
    description: 'Understand the business, users and objectives.',
  },
  {
    step: '02',
    title: 'Product Planning',
    description: 'Define features, workflows and priorities.',
  },
  {
    step: '03',
    title: 'UX/UI',
    description: 'Design the product experience.',
  },
  {
    step: '04',
    title: 'Development',
    description: 'Build the application and supporting systems.',
  },
  {
    step: '05',
    title: 'Testing',
    description: 'Validate functionality, performance and usability.',
  },
  {
    step: '06',
    title: 'Launch',
    description: 'Deploy the product into production.',
  },
  {
    step: '07',
    title: 'Continuous Improvement',
    description: 'Maintain, optimize and expand the product.',
  },
]

const audiences = [
  {
    title: 'Startups',
    description: 'Turn ideas into launch-ready digital products.',
  },
  {
    title: 'Growing Businesses',
    description: 'Replace manual processes and disconnected tools.',
  },
  {
    title: 'Established Companies',
    description: 'Modernize systems and improve operational efficiency.',
  },
  {
    title: 'Product Companies',
    description: 'Extend development capacity and launch new products.',
  },
]

const projectTypes = [
  'Customer Portals',
  'Admin Platforms',
  'SaaS Products',
  'Mobile Applications',
  'Dashboards',
  'Marketplaces',
  'Automation Systems',
  'Trading Platforms',
  'AI Products',
  'E-Commerce Platforms',
  'Internal Business Systems',
  'API Platforms',
]

const techCategories = [
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript'],
  },
  {
    category: 'Backend',
    items: ['Node.js', 'APIs', 'Databases'],
  },
  {
    category: 'Cloud & Infrastructure',
    items: ['Cloud platforms', 'Deployment systems', 'Monitoring'],
  },
  {
    category: 'Data',
    items: ['PostgreSQL', 'Supabase', 'Analytics systems'],
  },
  {
    category: 'Payments',
    items: ['Paystack', 'Flutterwave', 'Stripe', 'Other providers'],
  },
  {
    category: 'AI',
    items: ['LLM APIs', 'AI automation', 'Machine intelligence systems'],
  },
]

const faqs = [
  {
    q: 'What types of software does Omnix Lab build?',
    a: 'We build custom software, web applications, SaaS platforms, mobile apps, AI solutions, trading systems, e-commerce platforms and API integrations.',
  },
  {
    q: 'Can you build a product from an idea?',
    a: 'Yes. We work with you from discovery and planning through launch and continuous improvement.',
  },
  {
    q: 'Can you work with an existing application?',
    a: 'Absolutely. We can audit, modernize, extend, or take over development of an existing codebase.',
  },
  {
    q: 'Do you provide UI/UX design?',
    a: 'Yes, we include UX/UI design as part of every product development project.',
  },
  {
    q: 'Can you integrate payment gateways?',
    a: 'Yes, we integrate Paystack, Flutterwave, Stripe and other payment providers as required.',
  },
  {
    q: 'Can you integrate third-party APIs?',
    a: 'Yes, we integrate CRM, ERP, communication platforms, financial APIs, authentication providers and automation services.',
  },
  {
    q: 'Do you build SaaS platforms?',
    a: 'Yes, we build multi-tenant SaaS products with billing, subscriptions, permissions, dashboards and analytics.',
  },
  {
    q: 'Do you develop mobile applications?',
    a: 'Yes, we develop native iOS, Android, and cross-platform mobile applications.',
  },
  {
    q: 'Do you build AI-powered applications?',
    a: 'Yes, we build AI assistants, automation workflows, document intelligence, recommendation systems and AI SaaS products.',
  },
  {
    q: 'Do you develop trading systems?',
    a: 'Yes, we develop trading bots, arbitrage systems, market-making systems and portfolio automation tools.',
  },
  {
    q: 'How long does development take?',
    a: 'Timelines depend on complexity. Most projects range from 6 to 12 weeks. We provide a detailed estimate after discovery.',
  },
  {
    q: 'How much does software development cost?',
    a: 'Costs vary based on functionality and scope. We provide a project scope and investment estimate after understanding your requirements.',
  },
  {
    q: 'Do you provide post-launch support?',
    a: 'Yes, we offer ongoing maintenance, monitoring, feature updates and technical support.',
  },
  {
    q: 'Can you work with international clients?',
    a: 'Absolutely. We work with clients worldwide using remote-first collaboration.',
  },
  {
    q: 'How do we start a project?',
    a: 'Contact us through the form on this page. We will schedule a discovery call to understand your objectives.',
  },
]

export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-28 px-6 lg:px-8 overflow-hidden bg-gray-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/images/services-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-indigo-950/80 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">What We Build</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Software Solutions Built Around Your Business
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-10">
            From intelligent automation and SaaS platforms to web applications, mobile products and trading systems, Omnix Lab develops digital solutions designed around real business requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Start Your Project
            </Link>
            <Link
              href="/work"
              className="inline-flex px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
            >
              Explore Our Work
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
            <span>Software Development</span>
            <span>•</span>
            <span>SaaS</span>
            <span>•</span>
            <span>AI</span>
            <span>•</span>
            <span>Trading</span>
            <span>•</span>
            <span>Mobile</span>
            <span>•</span>
            <span>Web</span>
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Solutions for the Entire Digital Product Lifecycle
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Whether you are starting with an idea, replacing outdated software or expanding an existing platform, Omnix Lab provides the capabilities required to take your product from concept to production.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.slice(0, 4).map((service) => (
              <Link
                key={service.id}
                href={`#${service.id}`}
                className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <span className="text-indigo-600 font-bold text-sm">{service.number}</span>
                <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-2 group-hover:text-indigo-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm">{service.tagline}</p>
              </Link>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {services.slice(4).map((service) => (
              <Link
                key={service.id}
                href={`#${service.id}`}
                className="group p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <span className="text-indigo-600 font-bold text-sm">{service.number}</span>
                <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-2 group-hover:text-indigo-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm">{service.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED SERVICE SECTIONS */}
      {services.map((service, index) => (
        <section
          key={service.id}
          id={service.id}
          className={`py-20 lg:py-28 px-6 lg:px-8 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="lg:w-1/3">
                <span className="text-5xl font-bold text-indigo-200">{service.number}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
                  {service.title}
                </h2>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <Link
                  href={service.href}
                  className="inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  {service.cta}
                </Link>
              </div>
              <div className="lg:w-2/3 grid sm:grid-cols-2 gap-4">
                {service.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* TECHNOLOGY CAPABILITIES */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Modern Technology. Serious Development.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {techCategories.map((cat) => (
              <div key={cat.category} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-white mb-4">{cat.category}</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  {cat.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE DELIVER */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            From Idea to Production
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <span className="text-2xl font-bold text-indigo-600">{step.step}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{step.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/contact"
              className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </section>

      {/* WHO WE WORK WITH */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Built for Different Stages of Business
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {audiences.map((aud) => (
              <div key={aud.title} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{aud.title}</h3>
                <p className="text-gray-500 text-sm">{aud.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE CAN BUILD */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What Can We Build?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {projectTypes.map((type) => (
              <span key={type} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-full text-sm">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE CAPABILITIES */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Built for Serious Digital Operations
          </h2>
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
                <p className="text-gray-300 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Security by Design
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Authentication',
              'Authorization',
              'Role-based permissions',
              'Secure API handling',
              'Encrypted connections',
              'Protected environment variables',
              'Database security',
              'Audit logging where required',
              'Secure payment integrations',
              'Session management',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT & MAINTENANCE */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Launch Is Not the End</h2>
          <p className="text-gray-600 mb-8">
            We provide ongoing maintenance, monitoring, feature updates, security patches, infrastructure management and technical support.
          </p>
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Discuss Ongoing Support
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <span className="text-indigo-600 group-open:hidden">+</span>
                  <span className="text-indigo-600 hidden group-open:inline">−</span>
                </summary>
                <div className="px-6 pb-4 text-gray-600 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECT CTA */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Let&apos;s Build Something That Moves Your Business Forward</h2>
          <p className="text-indigo-100 text-lg mb-8">
            Tell us what you&apos;re trying to build, improve or automate. We&apos;ll help you determine the right software approach and next steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Start Your Project →
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Talk to Omnix Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}