'use client'

import { useState } from 'react'
import Link from 'next/link'

const WHATSAPP_URL = 'https://wa.me/2347033702874'
const TELEGRAM_URL = 'https://t.me/OmnixLab'
const EMAIL_ADDRESS = 'helloafrica@omnixlabsupport.com'

const services = [
  'Custom Software',
  'Web Application',
  'SaaS Platform',
  'Mobile Application',
  'Trading Bot',
  'Trading Platform',
  'AI Solution',
  'AI Automation',
  'E-commerce Platform',
  'API / Backend System',
  'Business Automation',
  'UI/UX Design',
  'Existing System Improvement',
  'Other',
]

const stages = [
  'Idea',
  'Requirements defined',
  'Design completed',
  'Prototype / MVP',
  'Existing product',
  'Existing system needs improvement',
  'Scaling an existing platform',
]

const budgets = [
  'Under $1,000',
  '$1,000 – $5,000',
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000 – $50,000',
  '$50,000+',
  'Not sure yet',
]

const timelines = [
  'Immediately',
  'Within 30 days',
  '1 – 3 months',
  '3 – 6 months',
  'Planning / exploring',
]

const howWeWork = [
  {
    step: '01',
    title: 'Discover',
    description: 'We understand your business, requirements and goals.',
  },
  {
    step: '02',
    title: 'Plan',
    description: 'We define the technical approach, scope and roadmap.',
  },
  {
    step: '03',
    title: 'Build',
    description: 'Our team designs, develops, tests and iterates.',
  },
  {
    step: '04',
    title: 'Launch & Support',
    description: 'We deploy the solution and provide ongoing support.',
  },
]

const solutions = [
  { icon: '🖥️', label: 'Custom Software' },
  { icon: '📦', label: 'SaaS Platforms' },
  { icon: '🤖', label: 'AI Solutions' },
  { icon: '📈', label: 'Trading Systems' },
  { icon: '🌐', label: 'Web Applications' },
  { icon: '📱', label: 'Mobile Applications' },
  { icon: '⚙️', label: 'Business Automation' },
  { icon: '🛒', label: 'E-commerce' },
]

const faqs = [
  {
    q: 'How quickly will you respond?',
    a: 'We typically respond within 1–2 business hours during working days. For enterprise inquiries, we aim for same‑day response.',
  },
  {
    q: 'Do you work with international clients?',
    a: 'Yes. Omnix Lab works with clients worldwide across multiple time zones.',
  },
  {
    q: 'Can you work with an existing development team?',
    a: 'Absolutely. We can collaborate with your in‑house team, complementing their skills and filling technical gaps.',
  },
  {
    q: 'Can you sign an NDA?',
    a: 'Yes, we regularly sign NDAs to protect your intellectual property and business information.',
  },
  {
    q: 'Can you take over an existing project?',
    a: 'Yes. We can audit the existing codebase, understand the architecture, and continue development seamlessly.',
  },
  {
    q: 'Do you provide ongoing maintenance?',
    a: 'Yes, we offer flexible maintenance and support packages for all delivered projects.',
  },
  {
    q: 'Can you build an MVP first?',
    a: 'Definitely. We often help clients build an MVP to validate the market before scaling to a full product.',
  },
  {
    q: 'Do you offer custom enterprise solutions?',
    a: 'Yes. We specialise in building tailored enterprise‑grade software, trading systems, AI, and SaaS platforms.',
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    service: services[0],
    stage: stages[0],
    budget: budgets[6], // Not sure yet
    timeline: timelines[4], // Planning / exploring
    description: '',
  })
  const [fileNames, setFileNames] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileNames(Array.from(e.target.files).map((f) => f.name))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim() || !form.email.trim() || !form.description.trim()) {
      setError('Please fill in your name, email, and project description.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          attachments: fileNames,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      // Generate a reference if the API doesn't return one
      const ref = data.reference || `OMX-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setReference(ref)
      setSubmitted(true)
    } catch (err) {
      console.error('Contact form error:', err)
      setError('Something went wrong. Please try again or contact us via WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Inquiry Received</h1>
          <p className="text-gray-300 mb-2">
            We&apos;ve received your project details. Our team will review your requirements and
            contact you through your preferred communication channel.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Inquiry Reference: <span className="font-mono text-blue-400">{reference}</span>
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black" />
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">Contact Omnix Lab</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Let&apos;s Build Something Exceptional</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Whether you&apos;re building a SaaS platform, trading system, AI solution, web application,
            mobile product, or custom business software, tell us what you&apos;re trying to achieve and
            we&apos;ll help you determine the right technical path.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#project-inquiry"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Start a Project →
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '💬',
              title: 'WhatsApp',
              detail: '+234 703 370 2874',
              description: 'Message us directly for quick project discussions.',
              href: WHATSAPP_URL,
              cta: 'Message on WhatsApp →',
            },
            {
              icon: '✉️',
              title: 'Email',
              detail: EMAIL_ADDRESS,
              description: 'Send us your requirements and documentation.',
              href: `mailto:${EMAIL_ADDRESS}`,
              cta: 'Send an Email →',
            },
            {
              icon: '✈️',
              title: 'Telegram',
              detail: '@OmnixLab',
              description: 'Reach us on Telegram for business inquiries.',
              href: TELEGRAM_URL,
              cta: 'Message on Telegram →',
            },
          ].map((card, i) => (
            <a
              key={i}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-gray-300 mb-1">{card.detail}</p>
              <p className="text-sm text-gray-400 mb-4">{card.description}</p>
              <span className="text-blue-400 group-hover:text-blue-300 transition-colors">
                {card.cta}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Project Inquiry Form */}
      <section id="project-inquiry" className="px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-2">Project Inquiry</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Tell Us About Your Project</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact details */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Work Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company / Organization</label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone / WhatsApp</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              />
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">What are you looking to build?</label>
              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              >
                {services.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Current Project Stage</label>
              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              >
                {stages.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Project Budget</label>
              <select
                name="budget"
                value={form.budget}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              >
                {budgets.map((b) => (
                  <option key={b} value={b} className="bg-gray-900">
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">When would you like to start?</label>
              <select
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              >
                {timelines.map((t) => (
                  <option key={t} value={t} className="bg-gray-900">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Tell us about your project *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="What are you trying to build, what problem should it solve, and what would success look like?"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition resize-none"
              />
            </div>

            {/* File attachment */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Attach project documents (optional)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700"
              />
              {fileNames.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {fileNames.join(', ')}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending Inquiry...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* How We Work */}
      <section className="px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-blue-400 mb-2 text-center">How We Handle Inquiries</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">From Discovery to Delivery</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {howWeWork.map((step) => (
            <div
              key={step.step}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-4xl font-bold text-blue-500 mb-3">{step.step}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section className="px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-blue-400 mb-2 text-center">What We Build</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What Can We Help You Build?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {solutions.map((sol) => (
            <div
              key={sol.label}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-3xl mb-2">{sol.icon}</div>
              <p className="text-sm font-medium">{sol.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Metrics */}
      <section className="px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-4xl font-bold text-blue-500">50+</p>
            <p className="text-gray-300 mt-2">Projects Delivered</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-4xl font-bold text-blue-500">99%</p>
            <p className="text-gray-300 mt-2">Client Satisfaction</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-4xl font-bold text-blue-500">Global</p>
            <p className="text-gray-300 mt-2">Client Delivery</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-4xl font-bold text-blue-500">24/7</p>
            <p className="text-gray-300 mt-2">Digital Solutions</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 lg:px-8 py-16 max-w-4xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-blue-400 mb-2 text-center">FAQ</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-medium">{faq.q}</span>
                <span className="text-blue-400">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 text-gray-300 text-sm">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-8 py-24">
        <div className="relative max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Have a complex problem to solve?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Let&apos;s turn your idea, system, or business challenge into a technology solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#project-inquiry"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Start a Project →
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                💬 WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}