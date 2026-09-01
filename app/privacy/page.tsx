import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Omnix Lab',
  description: 'Privacy Policy for Omnix Lab - Nigeria software development company. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: August 3, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none space-y-8">
          
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <p className="text-gray-700 leading-relaxed">
              At <strong>Omnix Lab</strong>, accessible from <strong>omnixlabssupport.com</strong>, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Omnix Lab and how we use it.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              When you contact us through our website, we may collect the following information:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Name</strong> — To address you properly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Email address</strong> — To respond to your inquiries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Phone number</strong> — Optional, for faster communication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Project details</strong> — To understand your requirements</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We use the information we collect in the following ways:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>To respond to your inquiries and provide customer service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>To understand your project requirements and provide accurate quotes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>To improve our website and services based on your feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>To send periodic emails about our services (only if requested)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Protection</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. Our website uses <strong>SSL encryption</strong> to protect data transmission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Our website may use cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings. Disabling cookies may affect the functionality of certain features on our site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We may use third-party services such as Google Analytics to analyze website traffic. These third-party services have their own privacy policies addressing how they use such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Request access to your personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Request correction or deletion of your data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span>Withdraw consent at any time</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <p className="text-gray-700">
                <strong>Omnix Lab</strong>
              </p>
              <p className="text-gray-600">
                📧 Email: Hello@omnixlabssupport.com
              </p>
              <p className="text-gray-600">
                💬 WhatsApp: +234 703 370 2874
              </p>
              <p className="text-gray-600">
                🌐 Website: omnixlabssupport.com
              </p>
              <p className="text-gray-600">
                📍 Location: Nigeria (Remote — Worldwide)
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Updates to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-center text-white">
          <h3 className="text-xl font-bold mb-2">Have Questions?</h3>
          <p className="text-indigo-100 mb-4">If you have any concerns about your privacy, we are here to help.</p>
          <Link
            href="/contact"
            className="inline-flex px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            Contact Us →
          </Link>
        </div>

      </div>
    </div>
  )
}
