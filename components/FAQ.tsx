'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    question: 'What services does Omnix Lab offer?',
    answer: 'We offer web development, trading bot development, software development, mobile applications, AI & automation, and cloud infrastructure services. Each solution is custom-built for your specific business needs.'
  },
  {
    question: 'How long does a typical project take?',
    answer: 'Project timelines vary based on complexity. A standard website takes 2-4 weeks, trading bots 4-8 weeks, and enterprise software 8-16 weeks. We always provide a detailed timeline during the discovery phase.'
  },
  {
    question: 'What is your pricing structure?',
    answer: 'We offer flexible pricing: fixed-price for well-defined projects, hourly rates for ongoing work, and monthly retainers for long-term partnerships. Contact us for a custom quote based on your requirements.'
  },
  {
    question: 'Do you provide ongoing support after launch?',
    answer: 'Yes! We offer 30 days of free post-launch support on all projects. Extended maintenance and support packages are available monthly. We ensure your solution continues running smoothly.'
  },
  {
    question: 'Can you work with our existing tech stack?',
    answer: 'Absolutely. Our team is proficient in multiple technologies and can integrate seamlessly with your existing infrastructure. We specialize in React, Next.js, Node.js, Python, AWS, and more.'
  },
  {
    question: 'How do you handle project communication?',
    answer: 'We provide a dedicated project manager and weekly progress updates. You get access to our project management tools (Notion, Slack) for real-time visibility into development progress.'
  },
  {
    question: 'Do you sign NDAs?',
    answer: 'Yes, we regularly sign NDAs and confidentiality agreements. Your intellectual property and business information are completely protected throughout and after our engagement.'
  },
  {
    question: 'What makes Omnix Lab different from other agencies?',
    answer: 'We combine enterprise-grade development standards with startup agility. Our founder-led approach ensures personal attention to every project. We focus on measurable business results, not just code delivery.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to know about working with us
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl text-indigo-500 flex-shrink-0"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}