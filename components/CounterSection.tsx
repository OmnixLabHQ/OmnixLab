'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  { end: 50, suffix: '+', label: 'Projects Delivered', icon: '🚀' },
  { end: 15, suffix: '+', label: 'Global Clients', icon: '🌍' },
  { end: 4, suffix: '+', label: 'Years Experience', icon: '⚡' },
  { end: 99, suffix: '%', label: 'Client Satisfaction', icon: '❤️' },
]

function CounterItem({ end, suffix, label, icon, delay }: { end: number; suffix: string; label: string; icon: string; delay: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="text-center"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <div className="text-5xl md:text-6xl font-bold text-white mb-2">
        {isInView ? <CountUp end={end} duration={2.5} suffix={suffix} /> : '0'}
      </div>
      <div className="text-gray-400 text-lg font-medium">{label}</div>
    </motion.div>
  )
}

export default function CounterSection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"></div>
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <CounterItem key={i} {...stat} delay={i * 0.2} />
          ))}
        </div>
      </div>
    </section>
  )
}
