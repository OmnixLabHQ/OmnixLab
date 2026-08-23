import Link from 'next/link'

export default function PortalLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
            🔐 Client Portal
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Your Projects, <span className="text-indigo-600">One Place</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Welcome to the Omnix Lab Client Portal — your dedicated space to track projects, view tasks, share files, and communicate directly with our team. Everything you need, right at your fingertips.
        </p>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: '📊', title: 'Project Tracking', desc: 'See real-time progress on all your projects' },
            { icon: '💬', title: 'Direct Messaging', desc: 'Chat with our team instantly' },
            { icon: '📁', title: 'File Sharing', desc: 'Upload and download project files securely' },
            { icon: '💰', title: 'Invoices', desc: 'View and manage your invoices' },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition text-left">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/portal/register"
            className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-lg"
          >
            Create Your Account →
          </Link>
          <Link
            href="/portal/login"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:border-indigo-300 hover:bg-gray-50 transition text-lg"
          >
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-6">
          New accounts are reviewed for approval. Existing clients get priority access.
        </p>
      </div>
    </div>
  )
}