import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Omnix Lab',
  description: 'Terms of Service for Omnix Lab - Nigeria software development company. Read our terms before using our services.',
}

export default function TermsPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-12">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500">Last updated: August 4, 2026</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <p className="text-gray-700 leading-relaxed">
              Welcome to <strong>Omnix Lab</strong>. By accessing our website at <strong>omnixlabssupport.com</strong> and using our services, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, please do not use our services.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Services</h2>
            <p className="text-gray-600 leading-relaxed">
              Omnix Lab provides software development services including but not limited to: web development, trading bot development, software engineering, mobile application development, AI solutions, and cloud infrastructure services. All services are provided based on agreed project scope and pricing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Project Agreements</h2>
            <p className="text-gray-600 leading-relaxed">
              Each project is governed by a separate agreement outlining scope, timeline, deliverables, and payment terms. Omnix Lab reserves the right to modify project timelines in the event of scope changes or unforeseen technical challenges.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Terms</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>50% upfront payment required to commence work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Remaining balance due upon project completion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Custom payment plans available for enterprise projects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>All payments are non-refundable after work has commenced</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              Upon full payment, the client owns the final deliverables including source code, designs, and documentation. Omnix Lab retains the right to display completed projects in our portfolio unless otherwise agreed in writing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Confidentiality</h2>
            <p className="text-gray-600 leading-relaxed">
              Omnix Lab agrees to keep all client information, project details, and business data strictly confidential. We sign NDAs upon request. Client data is never shared with third parties without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              Omnix Lab shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount paid for the specific project in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Support & Maintenance</h2>
            <p className="text-gray-600 leading-relaxed">
              All projects include 30 days of free post-launch support for bug fixes and minor adjustments. Extended maintenance packages are available for ongoing updates, security patches, and feature enhancements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              Either party may terminate a project agreement with written notice. In the event of termination, the client is responsible for payment for all work completed up to the termination date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you have questions about these Terms, contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <p className="text-gray-700"><strong>Omnix Lab</strong></p>
              <p className="text-gray-600">📧 Hello@omnixlabssupport.com</p>
              <p className="text-gray-600">💬 +234 703 370 2874</p>
              <p className="text-gray-600">🌐 omnixlabssupport.com</p>
            </div>
          </section>

        </div>

        <div className="mt-16 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-center text-white">
          <h3 className="text-xl font-bold mb-2">Ready to Start a Project?</h3>
          <p className="text-indigo-100 mb-4">Review our terms and let us build your next solution.</p>
          <Link href="/contact" className="inline-flex px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors">
            Get Started →
          </Link>
        </div>

      </div>
    </div>
  )
}
