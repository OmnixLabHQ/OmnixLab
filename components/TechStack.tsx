'use client'

import { motion } from 'framer-motion'

const techCategories = [
  {
    title: 'Frontend',
    icon: '🎨',
    tools: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Redux', 'Vue.js']
  },
  {
    title: 'Backend',
    icon: '⚙️',
    tools: ['Node.js', 'Python', 'Express', 'FastAPI', 'GraphQL', 'REST APIs']
  },
  {
    title: 'Database',
    icon: '🗄️',
    tools: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Firebase', 'Supabase']
  },
  {
    title: 'Cloud & DevOps',
    icon: '☁️',
    tools: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Vercel', 'Railway']
  },
  {
    title: 'AI & Data',
    icon: '🧠',
    tools: ['TensorFlow', 'OpenAI', 'LangChain', 'Pandas', 'Scikit-learn']
  },
  {
    title: 'Trading & Finance',
    icon: '📊',
    tools: ['WebSocket', 'REST APIs', 'CCXT', 'TradingView', 'Binance API']
  }
]

export default function TechStack() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Our Arsenal</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Technology Stack
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            We use battle-tested, enterprise-grade technologies to build scalable solutions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techCategories.map((category, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{category.icon}</span>
                <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.tools.map((tool, j) => (
                  <span
                    key={j}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-100 font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-default"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}