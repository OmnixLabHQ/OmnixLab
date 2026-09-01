import Link from 'next/link'
import type { Metadata } from 'next'

// ============ SEO LOCK — DO NOT MODIFY ============
export const metadata: Metadata = {
  title: 'About Omnix Lab | Global Software Development Company',
  description:
    'Omnix Lab is a global software development company founded by Akomolafe Nathaniel. We build trading bots, web apps, SaaS, AI solutions for clients worldwide. 50+ projects, 99% satisfaction.',
  keywords: [
    'Omnix Lab',
    'Akomolafe Nathaniel',
    'software development company',
    'global software company',
    'founder Omnix Lab',
    'CEO Omnix Lab',
    'trading bot developer',
    'web development company',
    'software development services',
  ],
  openGraph: {
    title: 'Omnix Lab | Global Software Development Company',
    description:
      'Global software development company. Trading bots, web apps, SaaS, AI. 50+ projects delivered.',
    type: 'website',
  },
}
// ============ END SEO LOCK ============

export default function AboutPage() {
  return (
    <div className="bg-gray-950 text-white">
      {/* Organization Schema Markup — PRESERVED */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Omnix Lab',
            description:
              'Global software development company founded by Akomolafe Nathaniel. Building trading bots, web applications, SaaS platforms, and AI solutions for businesses worldwide.',
            url: 'https://omnixlabssupport.com',
            logo: 'https://i.ibb.co/jXsT2ZB/image.jpg',
            foundingDate: '2022',
            founder: {
              '@type': 'Person',
              name: 'Akomolafe Nathaniel',
              jobTitle: 'Founder & CEO',
              description:
                'Akomolafe Nathaniel is the Founder and CEO of Omnix Lab, a global software development company. Expert in trading bot development, web development, and enterprise software development.',
              url: 'https://omnixlabssupport.com/about',
              sameAs: [
                'https://linkedin.com/in/akomolafe-nathaniel',
                'https://github.com/OmnixLabHQ',
              ],
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+2347033702874',
              email: 'Hello@omnixlabssupport.com',
              contactType: 'customer service',
              availableLanguage: ['English'],
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Lagos',
              addressCountry: 'Nigeria',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5.0',
              reviewCount: '41',
              bestRating: '5',
            },
            numberOfEmployees: '10',
            areaServed: 'Worldwide',
            knowsAbout: [
              'Web Development',
              'Trading Bot Development',
              'Software Development',
              'SaaS Development',
              'AI Solutions',
              'Mobile App Development',
            ],
          }),
        }}
      />

      {/* ================= HERO ================= */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 w-full">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">
              About Omnix Lab
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Developing the Digital Systems That Move Businesses Forward.
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Omnix Lab builds software, AI systems, trading technology, SaaS
              platforms and digital products designed to solve complex business
              problems and scale with ambition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Start a Project
              </Link>
              <Link
                href="/work"
                className="inline-flex px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                Explore Our Work
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                ['50+', 'Projects Delivered'],
                ['99%', 'Client Satisfaction'],
                ['Global', 'Delivery'],
                ['Enterprise', 'Technology'],
              ].map(([num, label]) => (
                <div key={label} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-blue-400">{num}</p>
                  <p className="text-xs text-gray-300 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPANY INTRODUCTION ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            We don&apos;t just build software.
            <br />
            <span className="text-gray-400">
              We build systems around the way businesses actually operate.
            </span>
          </h2>
          <div className="space-y-4 text-gray-300">
            <p>
              Omnix Lab is a global software development company specializing in
              custom software, SaaS platforms, AI solutions, trading technology,
              and enterprise systems. Founded by Akomolafe Nathaniel, we have
              delivered 50+ projects for clients across 10+ countries.
            </p>
            <p>
              Our approach combines rigorous software development with product
              thinking. We don&apos;t just write code — we design systems that
              improve efficiency, reduce operational complexity, and drive
              measurable business growth.
            </p>
            <p>
              From startups to established enterprises, Omnix Lab provides
              world-class development services with a 99% client satisfaction
              rate and a remote-first delivery model that spans the globe.
            </p>
          </div>
        </div>
      </section>

      {/* ================= THE OMNIX DIFFERENCE ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Built for Complexity. Designed for Growth.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ['01', 'Software Development', 'Custom software developed around business requirements.'],
              ['02', 'Intelligence', 'AI, automation and intelligent workflows that reduce operational complexity.'],
              ['03', 'Infrastructure', 'Scalable architectures designed for reliability, security and growth.'],
              ['04', 'Product Thinking', 'Every system is designed around measurable business outcomes.'],
            ].map(([num, title, desc]) => (
              <div
                key={num}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <span className="text-3xl font-bold text-blue-500">{num}</span>
                <h3 className="text-xl font-semibold mt-2">{title}</h3>
                <p className="text-gray-400 text-sm mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHAT WE BUILD ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Technology Across the Digital Stack
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            ['🖥️', 'Software Development', 'Custom business applications and enterprise systems.'],
            ['📦', 'SaaS Platforms', 'Multi-tenant products, dashboards and subscription platforms.'],
            ['🤖', 'AI & Automation', 'AI-powered systems, intelligent workflows and automation.'],
            ['📈', 'Trading Technology', 'Trading bots, market automation and financial technology.'],
            ['🌐', 'Web Applications', 'High-performance web platforms and customer-facing applications.'],
            ['📱', 'Mobile Applications', 'Cross-platform and native mobile experiences.'],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= OUR APPROACH ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            From Complexity to Clarity
          </h2>
          <div className="space-y-6">
            {[
              ['01', 'Discover', 'Understand the business, users and problem.'],
              ['02', 'Strategize', 'Define architecture, product direction and technical requirements.'],
              ['03', 'Develop', 'Build the system using modern software development practices.'],
              ['04', 'Validate', 'Test functionality, performance, security and usability.'],
              ['05', 'Launch', 'Deploy the product into production.'],
              ['06', 'Evolve', 'Maintain, optimize and continuously improve.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex items-start gap-4">
                <span className="text-2xl font-bold text-blue-500">{num}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMPANY PHILOSOPHY ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <blockquote className="text-2xl md:text-4xl font-bold text-center mb-12">
          “Technology should simplify complexity,
          <br />
          not create more of it.”
        </blockquote>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ['Build With Purpose', 'Every feature must have a reason.'],
            ['Build for Tomorrow', 'System should accommodate future growth.'],
            ['Obsess Over Experience', 'Complex technology should still feel simple to use.'],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= GLOBAL PRESENCE ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Built in Africa. Delivered for the World.
          </h2>
          <p className="text-gray-300 mb-8">
            Remote-first collaboration, international clients, and global delivery standards.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {['Africa', 'Europe', 'North America', 'Middle East', 'Asia', 'Other Markets'].map((region) => (
              <div key={region} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm">{region}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= INDUSTRIES ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          All Sectors Covered
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            ['🏦', 'FinTech'],
            ['🏥', 'Healthcare'],
            ['🛒', 'E-Commerce'],
            ['📚', 'Education'],
            ['🚚', 'Logistics'],
            ['🎮', 'Gaming'],
            ['🌾', 'Agriculture'],
            ['🏠', 'Real Estate'],
            ['📱', 'Telecom'],
            ['🎬', 'Media'],
            ['🛡️', 'Security'],
            ['💊', 'Pharma'],
          ].map(([icon, name]) => (
            <div key={name} className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
              <div className="text-3xl mb-2">{icon}</div>
              <p className="text-sm font-medium">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TECHNOLOGY ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Modern Technology. Serious Development.
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              ['Frontend', ['Next.js', 'React', 'TypeScript', 'Tailwind']],
              ['Backend', ['Node.js', 'APIs', 'Databases', 'Cloud']],
              ['Data & Infra', ['PostgreSQL', 'Supabase', 'Monitoring', 'Cloud']],
              ['Intelligence', ['AI', 'Machine Learning', 'Automation', 'Data Systems']],
            ].map(([category, techs]) => (
              <div key={category as string} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold mb-3">{category}</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  {(techs as string[]).map((tech) => (
                    <li key={tech}>• {tech}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECURITY & RELIABILITY ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Enterprise Mindset. Security by Design.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Secure authentication',
            'Role-based access control',
            'Data protection',
            'API security',
            'Secure payments',
            'Environment separation',
            'Monitoring',
            'Backups',
            'Auditability',
            'Production deployment practices',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SELECTED WORK ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            The Work Speaks for Itself.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              ['Crypto Trading Platform', 'FinTech', 'Automated trading system with risk management.'],
              ['E-commerce Platform', 'Retail', 'Full-featured online store with payment integration.'],
              ['Healthcare SaaS', 'Healthcare', 'Patient management and telemedicine solution.'],
              ['AI Automation', 'Enterprise', 'Intelligent workflow automation for business processes.'],
            ].map(([title, industry, desc]) => (
              <div key={title} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                <p className="text-sm text-blue-400">{industry}</p>
                <h3 className="text-xl font-semibold mt-1">{title}</h3>
                <p className="text-gray-400 text-sm mt-2">{desc}</p>
                <Link href="/work" className="text-blue-400 text-sm mt-3 inline-block">
                  View Case Study →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CLIENT EXPERIENCE ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A Better Way to Build Software
            </h2>
            <p className="text-gray-300 mb-6">
              Omnix Lab provides a structured digital workspace where clients can manage projects, files, messages, ideas, payments, invoices, requirements, and progress — all in one place.
            </p>
            <Link
              href="/portal"
              className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Explore Client Workspace →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Projects', 'Files', 'Messages', 'Payments', 'Invoices', 'Ideas'].map((item) => (
              <div key={item} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOUNDER / LEADERSHIP ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <img
              src="https://i.ibb.co/jXsT2ZB/image.jpg"
              alt="Akomolafe Nathaniel - Founder & CEO of Omnix Lab"
              className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover border-4 border-gray-700 shadow-2xl"
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-2">Founder & CEO</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Akomolafe Nathaniel</h2>
            <p className="text-gray-300 leading-relaxed">
              Akomolafe Nathaniel is the visionary Founder and CEO of Omnix Lab.
              With over 4 years of expertise in software development, he has
              personally led the delivery of 50+ successful projects for clients
              across 10+ countries, earning a 99% client satisfaction rate.
            </p>
            <p className="text-gray-400 mt-4">
              His focus: software development, entrepreneurship, technology, product development, and building a global software company.
            </p>
          </div>
        </div>
      </section>

      {/* ================= COMPANY TIMELINE ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Journey</h2>
        <div className="space-y-6">
          {[
            ['01', 'Founded', 'Omnix Lab begins its journey solving complex digital problems.'],
            ['02', 'First Products', 'Expansion into software and digital product development.'],
            ['03', 'Advanced Systems', 'Expansion into SaaS, automation and trading technology.'],
            ['04', 'Global Delivery', 'Serving clients beyond the local market.'],
            ['05', 'Enterprise Platform', 'Development of the Omnix client ecosystem.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="flex items-start gap-4">
              <span className="text-2xl font-bold text-blue-500">{num}</span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= LONG-TERM VISION ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Building Beyond Projects. Building Infrastructure for the Future.
          </h2>
          <p className="text-gray-300 mb-8">
            Omnix Lab isn&apos;t only a services company. The long-term direction encompasses software products, SaaS, AI systems, automation, financial technology, proprietary platforms, and recurring technology products.
          </p>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Values</h2>
        <div className="grid md:grid-cols-5 gap-6 text-center">
          {[
            ['Integrity', 'We build trust before technology.'],
            ['Precision', 'Details matter.'],
            ['Ownership', 'We take responsibility for outcomes.'],
            ['Innovation', 'We continuously improve how technology solves problems.'],
            ['Partnership', 'Clients aren’t tickets in a queue.'],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: 'What does Omnix Lab specialize in?', a: 'We specialize in custom software, SaaS platforms, trading technology, AI solutions, web applications, and mobile development.' },
              { q: 'What types of companies do you work with?', a: 'We work with startups, scaleups, and established enterprises across FinTech, Healthcare, E-Commerce, Logistics, and more.' },
              { q: 'Can Omnix Lab handle enterprise projects?', a: 'Yes. We build enterprise-grade systems with secure authentication, RBAC, scalable architecture, and production deployment practices.' },
              { q: 'Do you work with international clients?', a: 'Absolutely. We work with clients worldwide, with remote-first collaboration and flexible timezone coverage.' },
              { q: 'How does your development process work?', a: 'Our approach: Discover → Strategize → Develop → Validate → Launch → Evolve. Weekly updates and direct communication included.' },
              { q: 'Do you provide post-launch support?', a: 'Yes, we offer 30 days free support and extended maintenance packages.' },
              { q: 'Can you take over an existing project?', a: 'Yes. We can audit the existing codebase and continue development seamlessly.' },
              { q: 'How do clients track their projects?', a: 'Clients use the Omnix Client Workspace — a structured portal to manage projects, files, messages, invoices, payments, and progress.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none">
                  <span className="font-medium">{faq.q}</span>
                  <span className="text-blue-400 group-open:hidden">+</span>
                  <span className="text-blue-400 hidden group-open:inline">−</span>
                </summary>
                <div className="px-6 pb-4 text-gray-300 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Have a Complex Problem Worth Solving?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Let&apos;s turn your idea, challenge or business requirement into a technology system built for the real world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Start a Project
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl"
            >
              Talk to Omnix Lab
            </Link>
          </div>
          <Link href="/work" className="inline-block mt-6 text-blue-400">
            Explore Our Work →
          </Link>
        </div>
      </section>
    </div>
  )
}
