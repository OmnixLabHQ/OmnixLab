import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Omnix Lab',
  description: 'Privacy Policy for Omnix Lab - Nigeria software development company.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose">
        <h1>Privacy Policy</h1>
        <p>Last updated: August 2026</p>
        <p>Omnix Lab (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide when contacting us: name, email, phone number, and project details.</p>
        <h2>How We Use Your Information</h2>
        <p>We use your information to respond to inquiries, provide services, and improve our website.</p>
        <h2>Data Security</h2>
        <p>We implement industry-standard security measures to protect your data.</p>
        <h2>Contact</h2>
        <p>For questions about this policy, contact us at helloafrica@omnixlabsupport.com.</p>
      </div>
    </div>
  )
}