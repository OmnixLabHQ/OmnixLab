'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    q: 'What type of software does Omnix Lab build?',
    a: 'We build custom software, web applications, SaaS platforms, mobile apps, AI solutions, trading systems, e-commerce platforms, business automation, and API integrations.'
  },
  {
    q: 'How does the development process work?',
    a: 'We follow a structured process: Discover, Plan, Build, Validate, and Launch. You get weekly updates and a dedicated Client Workspace to track everything.'
  },
  {
    q: 'How long does a project take?',
    a: 'Timelines depend on complexity. Most projects range from 6 to 12 weeks. We provide a detailed estimate after the discovery phase.'
  },
  {
    q: 'Can you work with an existing application?',
    a: 'Yes. We can audit, modernize, extend, or take over development of an existing codebase.'
  },
  {
    q: 'Do you provide post-launch support?',
    a: 'Yes. We offer ongoing maintenance, monitoring, feature updates, security patches, and technical support.'
  },
  {
    q: 'How do clients monitor their projects?',
    a: 'Every client gets a private Client Workspace where they can view projects, files, messages, invoices, payments, ideas, and activity.'
  },
  {
    q: 'How do payments work?',
    a: 'We provide transparent invoicing and support multiple payment methods, including online payments, bank transfer, and USDT.'
  },
  {
    q: 'Can I start with an idea before defining the full project?',
    a: 'Absolutely. We help you shape the idea, define the scope, and build an MVP first if needed.'
  },
]

const services = [
  { number: '01', title: 'Custom Software Development', desc: 'Business applications, internal platforms and specialized software.' },
  { number: '02', title: 'Web & SaaS Development', desc: 'High-performance websites, SaaS platforms and web applications.' },
  { number: '03', title: 'AI & Intelligent Solutions', desc: 'AI-powered applications, automation and intelligent workflows.' },
  { number: '04', title: 'Trading & Financial Technology', desc: 'Trading bots, market systems, analytics and automation.' },
  { number: '05', title: 'Mobile Application Development', desc: 'iOS, Android and cross-platform applications.' },
  { number: '06', title: 'Business Automation', desc: 'Systems that automate repetitive processes and improve operational efficiency.' },
]

const whyOmnix = [
  { title: 'Business First', desc: 'Technology decisions are connected to the actual business objective.' },
  { title: 'Modern Development', desc: 'Solutions are built using current development technologies and scalable software design.' },
  { title: 'Transparent Delivery', desc: 'Clients can follow projects, communicate, review files and monitor progress through the Client Workspace.' },
  { title: 'Long-Term Thinking', desc: 'The objective is not simply to launch software. It is to create something that can evolve with the business.' },
]

const featuredWork = [
  {
    title: 'Crypto Trading Platform',
    category: 'Trading Technology',
    desc: 'Real-time trading automation platform built for high-speed market execution.',
    image: '/images/trading-platform.jpg',
    link: '/work/crypto-trading-platform',
  },
  {
    title: 'Healthcare SaaS Platform',
    category: 'SaaS Platform',
    desc: 'Centralized healthcare management software designed to simplify appointments, patient information and operational workflows.',
    image: '/images/healthcare-saas.jpg',
    link: '/work/healthcare-saas',
  },
  {
    title: 'AI Content Generator',
    category: 'AI & Automation',
    desc: 'AI-powered content generation platform with team collaboration, SEO optimization, and brand voice control.',
    image: '/images/ai-content-generator.jpg',
    link: '/work/ai-content-generator',
  },
]

const processSteps = [
  { step: '01', title: 'Discover', desc: 'Understand the business, problem and desired outcome.' },
  { step: '02', title: 'Plan', desc: 'Define requirements, product direction and implementation strategy.' },
  { step: '03', title: 'Build', desc: 'Develop the product through controlled development cycles.' },
  { step: '04', title: 'Validate', desc: 'Test functionality, performance, usability and reliability.' },
  { step: '05', title: 'Launch & Grow', desc: 'Deploy the product and continue improving it as the business evolves.' },
]

const technologies = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'APIs'] },
  { category: 'Database', items: ['PostgreSQL', 'Supabase'] },
  { category: 'Infrastructure', items: ['Cloud', 'CI/CD', 'Monitoring'] },
  { category: 'AI', items: ['LLMs', 'Automation', 'Intelligent systems'] },
]

const testimonials = [
  { quote: 'Omnix Lab built exactly what we needed. Our operations are streamlined and patients love the telemedicine feature.', author: 'Dr. Amina Yusuf', role: 'CEO, MediCare Plus' },
  { quote: 'Our sales doubled after Omnix Lab rebuilt our platform. The mobile experience is now seamless.', author: 'Sarah Johnson', role: 'Founder, CloudStack Solutions' },
  { quote: 'The dashboard Omnix Lab built gives us a competitive edge. Real-time data at our fingertips.', author: 'David Okafor', role: 'CTO, DataVault Systems' },
]

const industries = ['Financial Technology', 'E-commerce', 'Healthcare', 'Logistics', 'SaaS', 'Professional Services', 'Real Estate', 'Technology', 'Startups', 'Enterprise Businesses']

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="bg-gray-950 text-white min-h-screen overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/images/home-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Soft glow */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">
              Global Software Development
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Build Digital Products That Move Your Business Forward.
            </h1>
            <p className="text-lg text-gray-300 mb-10">
              Omnix Lab builds high-performance software, SaaS platforms, AI solutions, trading systems, web applications and mobile products for ambitious businesses worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Start a Project
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                Explore Our Work
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['50+', 'Projects'],
                ['99%', 'Client Satisfaction'],
                ['Global', 'Delivery'],
                ['24/7', 'Digital Systems'],
              ].map(([value, label]) => (
                <div key={label} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{value}</p>
                  <p className="text-xs text-gray-300 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY/CAPABILITY STRIP */}
      <section className="py-12 border-y border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400 mb-6">Built With Modern Technology</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Next.js', 'React', 'Node.js', 'TypeScript', 'Python', 'AI', 'Cloud', 'Supabase', 'PostgreSQL', 'APIs'].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY INTRODUCTION */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            Software built around your business.
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Omnix Lab helps businesses turn complex ideas into reliable digital products. From business platforms and SaaS applications to AI systems, mobile applications and automated solutions, we combine product thinking, software development and modern technology to create solutions designed for real-world growth.
            </p>
            <Link href="/about" className="inline-flex text-blue-400 hover:text-blue-300">
              Discover Omnix Lab →
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-3">What we do</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Technology Solutions Built Around Your Ambition</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Six premium capabilities designed to cover the entire digital product lifecycle.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={service.number}
                className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:shadow-xl transition-all"
              >
                <span className="text-3xl font-bold text-blue-400">{service.number}</span>
                <h3 className="text-xl font-bold text-white mt-3 mb-2 group-hover:text-blue-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY OMNIX LAB */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Businesses That Think Beyond Today</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyOmnix.map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT WORKSPACE DIFFERENTIATOR */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Project. Your Workspace. Your Visibility.</h2>
            <p className="text-gray-300 mb-6">
              Every client receives a dedicated workspace to manage communication, projects, files, invoices, payments, ideas and important project information in one secure environment.
            </p>
            <Link href="/portal" className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              Explore Client Workspace
            </Link>
          </div>
          {/* Mockup */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="ml-2 text-sm text-gray-400">Client Workspace</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Project Progress</span>
                <span className="text-sm text-white font-semibold">78%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-sm">
                  <p className="text-gray-300">Milestones</p>
                  <p className="text-white font-semibold">4 of 6</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-sm">
                  <p className="text-gray-300">Files</p>
                  <p className="text-white font-semibold">12</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-sm">
                  <p className="text-gray-300">Invoices</p>
                  <p className="text-white font-semibold">2</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-sm">
                  <p className="text-gray-300">Messages</p>
                  <p className="text-white font-semibold">3 new</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED WORK */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Selected Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredWork.map((work) => (
              <Link
                key={work.title}
                href={work.link}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={work.image} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <p className="text-sm text-blue-400 uppercase tracking-wider">{work.category}</p>
                  <h3 className="text-xl font-bold text-white mt-1 mb-2">{work.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{work.desc}</p>
                  <span className="text-blue-400 text-sm group-hover:underline">View Case Study →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/work" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              View All Work
            </Link>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Technology With Measurable Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ['50+', 'Projects Delivered'],
              ['99%', 'Client Satisfaction'],
              ['24/7', 'Digital Systems'],
              ['Global', 'Client Delivery'],
            ].map(([value, label]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-4xl font-bold text-blue-400">{value}</p>
                <p className="text-gray-300 mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built Across Industries</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry) => (
              <span key={industry} className="px-5 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DEVELOPMENT PROCESS */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">From Idea to Production</h2>
          <div className="grid md:grid-cols-5 gap-8">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <span className="text-3xl font-bold text-blue-400">{step.step}</span>
                <h3 className="font-semibold text-white mt-2">{step.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY ECOSYSTEM */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Modern Technology. Purposefully Applied.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {technologies.map((tech) => (
              <div key={tech.category} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-3">{tech.category}</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  {tech.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-300 italic mb-4">"{test.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold">
                    {test.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white">{test.author}</p>
                    <p className="text-gray-400 text-sm">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL CLIENTS */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Businesses Worldwide</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Omnix Lab works with businesses and entrepreneurs beyond borders, delivering software solutions through a modern digital development process.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <span className="text-blue-400">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-gray-400 text-sm">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Have a Product in Mind? Let's Build It.</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Tell us what you're trying to build, improve or automate. We'll help turn the idea into a practical software solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              Start a Project
            </Link>
            <a href="mailto:helloafrica@omnixlab-production.up.railway.app" className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20">
              Talk to Omnix Lab
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}