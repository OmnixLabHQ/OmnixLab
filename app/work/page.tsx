'use client'

import { useState } from 'react'
import Link from 'next/link'
import { allProjects, caseStudies, portfolioCategories, type WorkProject } from '@/lib/work'

export default function WorkPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedProject, setSelectedProject] = useState<WorkProject | null>(null)
  const [showModal, setShowModal] = useState(false)

  const filteredProjects = activeCategory === 'All'
    ? allProjects
    : allProjects.filter((project) => {
        if (project.type === 'case-study') {
          // Map existing categories to new filter categories
          if (activeCategory === 'Web') return project.category === 'E-Commerce'
          if (activeCategory === 'SaaS') return project.category === 'SaaS Platforms'
          if (activeCategory === 'AI & Automation') return project.category === 'AI Solutions'
          if (activeCategory === 'FinTech') return project.industry === 'FinTech'
          if (activeCategory === 'Trading') return project.category === 'Trading Systems'
          if (activeCategory === 'Healthcare') return project.industry === 'Healthcare'
          if (activeCategory === 'Mobile') return project.category === 'Mobile Applications'
          if (activeCategory === 'Real Estate') return false // existing case studies don't include Real Estate
          if (activeCategory === 'Web3') return false
          return false
        } else {
          // Video projects have category or industry
          if (activeCategory === 'Web') return project.category === 'Web Development' || project.industry === 'Food & Beverage' || project.industry === 'Lifestyle'
          if (activeCategory === 'SaaS') return project.category === 'SaaS'
          if (activeCategory === 'AI & Automation') return project.category === 'AI & Automation' || project.industry === 'Technology'
          if (activeCategory === 'FinTech') return project.industry === 'FinTech' || project.industry === 'Finance'
          if (activeCategory === 'Trading') return project.category === 'Trading Systems'
          if (activeCategory === 'Healthcare') return project.industry === 'Healthcare'
          if (activeCategory === 'Real Estate') return project.industry === 'Real Estate'
          if (activeCategory === 'Mobile') return project.category === 'Mobile Applications'
          if (activeCategory === 'Web3') return project.category === 'Web3'
          return false
        }
      })

  // Featured project: OMNIX AI
  const featuredProject = allProjects.find((p) => p.slug === 'omnix-ai') || allProjects[0]
  const otherProjects = filteredProjects.filter((p) => p.slug !== featuredProject.slug)

  const handleOpenModal = (project: WorkProject) => {
    setSelectedProject(project)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProject(null)
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* HERO */}
      <section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/about-hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-indigo-950/85 to-black/90" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-blue-400 mb-4">Our Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Work That Moves Businesses Forward</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">Explore digital products, platforms and intelligent systems built by Omnix Lab for businesses across industries.</p>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-8">15+ Projects — Web • SaaS • AI • FinTech • Mobile • Web3</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start a Project</Link>
            <a href="#portfolio" className="inline-flex px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl">Explore Our Work</a>
          </div>
        </div>
      </section>

      {/* CREDIBILITY / TRUST STRIP */}
      <section className="px-6 lg:px-8 py-12 border-y border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-6">Selected Work Across Multiple Industries</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['FinTech', 'Healthcare', 'E-Commerce', 'Logistics', 'SaaS', 'AI', 'Trading', 'Real Estate', 'Food & Beverage', 'Web3'].map((industry) => (
              <span key={industry} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-full">{industry}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {portfolioCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECT */}
      <section className="px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured Project</h2>
          {featuredProject.type === 'case-study' ? (
            <Link href={`/work/${featuredProject.slug}`} className="group block bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all">
              <div className="grid lg:grid-cols-2">
                <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
                  <img src={featuredProject.heroImage} alt={featuredProject.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Featured</span>
                    <span className="text-gray-400 text-sm">{featuredProject.industry} • {featuredProject.category}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">{featuredProject.title}</h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-semibold text-blue-400">The Challenge</p>
                      <p className="text-gray-300 text-sm">{featuredProject.problem}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-400">The Solution</p>
                      <p className="text-gray-300 text-sm">{featuredProject.solution}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredProject.tech.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/10">{tech}</span>
                    ))}
                  </div>
                  <span className="inline-flex text-blue-400 font-medium group-hover:underline">View Case Study →</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all">
              <div className="grid lg:grid-cols-2">
                <div className="relative overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
                  <video
                    src={featuredProject.video}
                    poster={featuredProject.poster}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">▶</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Featured</span>
                    <span className="text-gray-400 text-sm">{featuredProject.industry} • {featuredProject.category}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">{featuredProject.name}</h3>
                  <p className="text-gray-300 text-sm mb-6">{featuredProject.description}</p>
                  <button
                    onClick={() => handleOpenModal(featuredProject)}
                    className="inline-flex text-blue-400 font-medium hover:underline"
                  >
                    Explore Project →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PORTFOLIO GRID */}
      <section id="portfolio" className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Explore Our Work</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project) => (
              project.type === 'case-study' ? (
                <Link
                  key={project.slug}
                  href={`/work/${project.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all block"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">{project.industry} • {project.category}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.problem}</p>
                    <span className="inline-flex items-center gap-1 text-blue-400 font-medium text-sm group-hover:underline">View Case Study →</span>
                  </div>
                </Link>
              ) : (
                <div
                  key={project.slug}
                  className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => handleOpenModal(project)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <video
                      src={project.video}
                      poster={project.poster}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">▶</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">{project.industry} • {project.category}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                    <span className="inline-flex items-center gap-1 text-blue-400 font-medium text-sm group-hover:underline">View Project →</span>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY EXPERTISE */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Built With Modern Technology</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Frontend: React, Next.js, TypeScript', 'Backend: Node.js, Python, APIs', 'Data: PostgreSQL, MongoDB, Redis', 'AI: OpenAI, LangChain, TensorFlow', 'Cloud: AWS, Docker, Kubernetes, Railway'].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Industries We Serve</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['FinTech', 'Healthcare', 'Real Estate', 'E-Commerce', 'AI', 'Web3', 'Food & Beverage', 'Mobile', 'Business Automation', 'Trading'].map((industry) => (
              <span key={industry} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-sm">{industry}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT RESULTS */}
      <section className="px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Client Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ['50+', 'Projects Delivered'],
              ['99%', 'Client Satisfaction'],
              ['10+', 'Countries Served'],
              ['24/7', 'Automated Monitoring'],
            ].map(([num, label]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-4xl font-bold text-blue-400">{num}</p>
                <p className="text-gray-300 mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENT TESTIMONIALS */}
      <section className="px-6 lg:px-8 py-20 bg-gray-900/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Client Testimonials</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.slice(0, 3).map((project) => (
              <div key={project.slug} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-300 italic mb-4">{project.testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold">{project.testimonial.author.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-white">{project.testimonial.author}</p>
                    <p className="text-gray-400 text-sm">{project.testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Have a Product in Mind?</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Tell us what you are building, what you are trying to improve, or the problem you are trying to solve. Our team can help turn the idea into a reliable software solution.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">Start Your Project →</Link>
            <Link href="/contact" className="inline-flex px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10">Contact Omnix Lab</Link>
          </div>
        </div>
      </section>

      {/* QUICK VIEW MODAL */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{selectedProject.type === 'case-study' ? selectedProject.title : selectedProject.name}</h2>
              <button onClick={handleCloseModal} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
            </div>
            {selectedProject.type === 'video' && (
              <>
                <video
                  src={selectedProject.video}
                  poster={selectedProject.poster}
                  controls
                  autoPlay
                  className="w-full rounded-xl mb-4"
                />
                <p className="text-gray-300 text-sm mb-4">{selectedProject.description}</p>
                <p className="text-gray-400 text-xs">{selectedProject.industry} • {selectedProject.category}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
