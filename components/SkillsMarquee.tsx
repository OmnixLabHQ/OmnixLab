'use client'

import { motion } from 'framer-motion'

const skills = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs', 'TailwindCSS',
  'Figma', 'Git', 'CI/CD', 'Microservices', 'Serverless', 'TensorFlow',
  'Solidity', 'Web3', 'Kubernetes', 'Terraform', 'Ansible'
]

export default function SkillsMarquee() {
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
          Technologies We Master
        </p>
      </div>
      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...skills, ...skills].map((skill, i) => (
            <span
              key={i}
              className="px-6 py-2 bg-white rounded-full border border-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-default"
            >
              {skill}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}