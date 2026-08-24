import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Workspace | Omnix Lab',
  description:
    'Securely access your Omnix Lab projects, files, messages, ideas, payments and account information through your private client workspace.',
}

export default function ClientWorkspaceLandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
              O
            </div>
            <div className="leading-tight">
              <p className="font-bold text-white tracking-tight">Omnix Lab</p>
              <p className="text-xs text-gray-400 tracking-widest uppercase">Client Workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
              Help
            </a>
            <a href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6 lg:px-8">
        {/* Background image with dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/home-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950/95" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        {/* Soft glow */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">
              Client Workspace
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your Digital Workspace, Built Around Your Project.
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mb-10">
              Manage your projects, milestones, files, ideas, payments and
              conversations with Omnix Lab from one secure client workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/portal/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                Create Your Account
              </Link>
            </div>
          </div>

          {/* Right: Floating UI cards */}
          <div className="relative h-[400px] lg:h-[500px] hidden md:block">
            {/* Main floating card - Project overview */}
            <div className="absolute top-10 right-0 w-72 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-300">Project</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Active</span>
              </div>
              <p className="font-semibold text-white mb-2">E-Commerce Platform</p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">82% complete</p>
              <p className="text-xs text-gray-300 mt-2">Next milestone: Payment Integration</p>
            </div>

            {/* Payment card */}
            <div className="absolute bottom-20 left-0 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-300">Payment</span>
                <span className="ml-auto">💳</span>
              </div>
              <p className="text-2xl font-bold text-white">$4,800</p>
              <p className="text-xs text-green-300 mt-1">✓ Payment Confirmed</p>
            </div>

            {/* Message card */}
            <div className="absolute top-40 left-10 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-300">New Message</span>
              </div>
              <p className="text-sm font-medium text-white">Omnix Lab</p>
              <p className="text-xs text-gray-400">Project update: Dashboard v4 ready...</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-6 lg:px-8 py-12 border-y border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-8">
            A secure workspace for managing your engagement with Omnix Lab
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ['Project Visibility', 'Track progress and milestones.'],
              ['Secure Files', 'Keep project documents organized.'],
              ['Transparent Payments', 'View invoices and payment history.'],
              ['Direct Communication', 'Communicate with the Omnix Lab team.'],
            ].map(([title, desc]) => (
              <div key={title} className="text-center">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKSPACE FEATURES */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need. One Workspace.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ['📁', 'Projects', 'Track active projects, milestones, deliverables and progress from one place.'],
              ['📄', 'Files', 'Upload, organize and securely access project documents and deliverables.'],
              ['💬', 'Messages', 'Communicate directly with the Omnix Lab team throughout your project.'],
              ['💳', 'Payments', 'View invoices, payment status, payment history and available payment options.'],
              ['💡', 'Ideas', 'Share ideas, requirements and suggestions with the development team.'],
              ['🔔', 'Notifications', 'Stay informed about project updates, messages, invoices and important activity.'],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE WORKSPACE PREVIEW */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            A Workspace Designed for Your Project
          </h2>
          {/* Mockup */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <span className="text-sm text-gray-400">Omnix Lab — Client Workspace</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] min-h-[300px]">
              <div className="bg-gray-900/80 p-4 border-r border-white/10">
                <p className="text-sm text-gray-300 font-semibold mb-4">Workspace</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">Dashboard</li>
                  <li className="px-2 py-1">Projects</li>
                  <li className="px-2 py-1">Files</li>
                  <li className="px-2 py-1">Messages</li>
                  <li className="px-2 py-1">Payments</li>
                  <li className="px-2 py-1">Ideas</li>
                  <li className="px-2 py-1">Settings</li>
                </ul>
              </div>
              <div className="p-6">
                <p className="text-lg font-semibold text-white mb-4">Welcome back</p>
                <div className="grid grid-cols-3 gap-4">
                  {[['Active Projects', '3'], ['Pending Invoices', '1'], ['Unread Messages', '2']].map(([label, value]) => (
                    <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-300 mb-3">Recent Activity</p>
                  <div className="space-y-2">
                    <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 text-sm text-gray-400">
                      Milestone approved: UI Design
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 text-sm text-gray-400">
                      New file uploaded: dashboard-v4.fig
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Designed With Security in Mind</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              'Secure Authentication',
              'Protected Client Data',
              'Controlled Access',
              'Activity Awareness',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Getting Started Is Simple</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              ['01', 'Create Your Account', 'Create your Omnix Lab Client Workspace account.'],
              ['02', 'Access Your Workspace', 'Sign in securely to your private workspace.'],
              ['03', 'Manage Your Project', 'View projects, files, messages, ideas and payments.'],
              ['04', 'Work With Omnix Lab', 'Keep everything connected throughout the engagement.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="text-center">
                <span className="text-3xl font-bold text-blue-400">{num}</span>
                <h3 className="font-semibold text-white mt-2">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXISTING / NEW CLIENT CTAs */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Already Working With Omnix Lab?</h3>
            <p className="text-gray-400 mb-6">
              Access your projects, files, messages and account information from your private workspace.
            </p>
            <Link
              href="/portal/login"
              className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Sign In
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Starting a New Project?</h3>
            <p className="text-gray-400 mb-6">
              Create your Client Workspace account and begin your journey with Omnix Lab.
            </p>
            <Link
              href="/portal/register"
              className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Your Project. Your Workspace. One Place.</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Stay connected with your Omnix Lab project from planning through delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/portal/login"
              className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/portal/register"
              className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <p className="font-bold text-white">Omnix Lab</p>
            <p className="text-sm text-gray-400">Global Software Development</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/contact" className="hover:text-white transition-colors">Support</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p className="text-sm text-gray-500">© 2026 Omnix Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}