'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$2,000',
    period: 'starting from',
    description: 'Perfect for small businesses and startups',
    popular: false,
    features: [
      'Custom website (up to 5 pages)',
      'Responsive design',
      'Basic SEO setup',
      'Contact form integration',
      '2 rounds of revisions',
      '14-day delivery',
      '30 days support'
    ],
    gradient: 'from-gray-600 to-gray-700'
  },
  {
    name: 'Professional',
    price: '$5,000',
    period: 'starting from',
    description: 'Ideal for growing businesses',
    popular: true,
    features: [
      'Everything in Starter',
      'Up to 15 pages',
      'Advanced SEO optimization',
      'CMS integration',
      'E-commerce functionality',
      'Payment gateway setup',
      'Custom animations',
      'Performance optimization',
      'Priority support',
      '60 days support'
    ],
    gradient: 'from-indigo-600 to-purple-600'
  },
  {
    name: 'Enterprise',
    price: '$10,000',
    period: 'starting from',
    description: 'For large-scale projects and platforms',
    popular: false,
    features: [
      'Everything in Professional',
      'Unlimited pages',
      'Custom SaaS development',
      'API development & integration',
      'Database architecture',
      'Cloud infrastructure setup',
      'CI/CD pipeline',
      'Load testing',
      'Security audit',
      'Dedicated project manager',
      '24/7 priority support',
      '90 days support'
    ],
    gradient: 'from-gray-800 to-gray-900'
  }
]

export default function Pricing() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choose the plan that fits your project. All prices are starting estimates — contact us for a custom quote.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-50 to-white border-2 border-indigo-500 shadow-2xl shadow-indigo-200 scale-105'
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                </div>
                <p className="text-sm text-gray-400">{plan.period}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={`block text-center py-3.5 rounded-full font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    : 'border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}