import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="bg-white pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">About us</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">We are Omnix Lab</h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            A premium development studio founded by Akomolafe Nathaniel, dedicated to building 
            software that gives businesses a competitive edge in the digital economy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-500 leading-relaxed">
              To empower businesses worldwide with cutting-edge technology solutions that drive 
              measurable growth. We believe in writing clean code, delivering on time, and building 
              products that scale.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-500 leading-relaxed">
              To become the most trusted development partner for companies seeking digital 
              transformation — from startups launching MVPs to enterprises scaling their infrastructure.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 lg:p-12 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why work with us?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Technical Excellence', desc: 'Our team stays at the cutting edge of technology, using the best tools for each project.' },
              { title: 'Clear Communication', desc: 'Regular updates, transparent timelines, and direct access to developers.' },
              { title: 'Global Perspective', desc: 'We work with clients across time zones, delivering solutions that work worldwide.' },
              { title: 'Long-term Partnership', desc: 'We don&apos;t just deliver and leave. We provide ongoing support and optimization.' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Let&apos;s work together</h2>
          <p className="text-gray-500 mb-8">Ready to build something great? Reach out today.</p>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  )
}