export default function WorkPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Our Work</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A selection of projects we&apos;ve delivered for clients worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Crypto Trading Platform', category: 'Trading Bot', desc: 'Automated trading system with real-time analytics and risk management dashboard.' },
            { title: 'E-Commerce Platform', category: 'Web Development', desc: 'Full-featured online store with inventory management and payment processing.' },
            { title: 'Healthcare SaaS', category: 'Software Development', desc: 'Patient management system with appointment scheduling and telemedicine features.' },
            { title: 'FinTech Dashboard', category: 'Web Development', desc: 'Real-time financial data visualization and portfolio management interface.' },
            { title: 'Delivery Mobile App', category: 'Mobile Development', desc: 'Cross-platform delivery app with real-time tracking and driver management.' },
            { title: 'AI Content Generator', category: 'AI & Automation', desc: 'Content creation platform powered by GPT models with team collaboration.' },
          ].map((project, i) => (
            <div key={i} className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
              <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl font-bold text-indigo-300">{project.title.charAt(0)}</span>
              </div>
              <div className="p-6">
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">{project.category}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-500 text-sm">{project.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}