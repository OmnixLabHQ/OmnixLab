import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Omnix<span className="text-gray-400 font-normal">Lab</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Nigeria&apos;s most trusted trading bot development and web development company. Building crypto bots, forex bots, SaaS, and AI solutions worldwide.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">Web Development</Link></li>
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">Trading Bot Systems</Link></li>
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">Software Development</Link></li>
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">Mobile Applications</Link></li>
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">AI & Automation</Link></li>
              <li><Link href="/services" className="hover:text-gray-900 transition-colors">Cloud Infrastructure</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="mailto:helloafrica@omnixlabsupport.com" className="hover:text-gray-900 transition-colors">
                  helloafrica@omnixlabsupport.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/2347033702874" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                  +234 703 370 2874
                </a>
              </li>
              <li>Available Worldwide</li>
              <li className="pt-2">
                <a href="https://www.trustpilot.com/evaluate/omnixlabsupport.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">
                  ⭐ Leave a Review
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 Omnix Lab. Founded by Akomolafe Nathaniel. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Building the future, one solution at a time.
          </p>
        </div>

      </div>
    </footer>
  )
}