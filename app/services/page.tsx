import Link from 'next/link'

export default function ServicesPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">What we offer</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Comprehensive development solutions tailored to your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[
            { title: 'Web Development', price: 'From $2,000', desc: 'Custom websites, e-commerce platforms, and web applications using React, Next.js, and modern technologies.', features: ['Responsive design', 'SEO optimization', 'CMS integration', 'Performance tuning', 'Analytics setup'] },
            { title: 'Trading Bot Development', price: 'From $5,000', desc: 'Algorithmic trading systems for crypto, forex, and stocks with real-time execution and risk management.', features: ['Strategy development', 'Backtesting engine', 'Risk management', 'Multi-exchange support', 'Performance dashboard'] },
            { title: 'Software Development', price: 'From $10,000', desc: 'Enterprise SaaS platforms, internal tools, and custom business software built to scale.', features: ['Custom architecture', 'API development', 'Database design', 'Third-party integrations', 'Admin dashboards'] },
            { title: 'Mobile Applications', price: 'From $8,000', desc: 'Native iOS and Android apps, plus cross-platform solutions for maximum market reach.', features: ['iOS & Android', 'Push notifications', 'Payment integration', 'Offline support', 'App store submission'] },
            { title: 'AI & Automation', price: 'From $3,000', desc: 'Intelligent solutions using machine learning, NLP, and predictive analytics.', features: ['Chatbot development', 'Content generation', 'Data analysis', 'Process automation', 'Model training'] },
            { title: 'Cloud & DevOps', price: 'From $2,500', desc: 'Scalable infrastructure with CI/CD pipelines and monitoring solutions.', features: ['AWS/Cloud setup', 'CI/CD pipeline', 'Auto-scaling', 'Security hardening', '24/7 monitoring'] },
          ].map((service, i) => (
            <div key={i} className="p-8 lg:p-10 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-indigo-600 font-semibold mb-4">{service.price}</p>
              <p className="text-gray-500 mb-6">{service.desc}</p>
              <ul className="space-y-2 mb-8">
                {service.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block text-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}