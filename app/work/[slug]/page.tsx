import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { allProjects, caseStudies, videoProjects, type WorkProject } from '@/lib/work'

export function generateStaticParams() {
  return allProjects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = allProjects.find(p => p.slug === slug)

  if (!project) {
    return {
      title: 'Project Not Found | Omnix Lab',
    }
  }

  const name = project.type === 'case-study' ? project.title : project.name
  const description = project.type === 'case-study'
    ? project.solution
    : project.description

  return {
    title: `${name} | Omnix Lab`,
    description: description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = allProjects.find(p => p.slug === slug)

  if (!project) notFound()

  // For case studies, render the detailed case study page
  if (project.type === 'case-study') {
    return (
      <div className="bg-gray-950 text-white min-h-screen pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/work" className="text-blue-400 hover:text-blue-300 font-medium text-sm mb-8 inline-block">
            Back to Portfolio
          </Link>

          <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-10">
            <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">{project.category}</span>
              <span className="text-sm text-gray-400">Timeline: {project.timeline}</span>
              <span className="text-sm text-gray-400">Industry: {project.industry}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{project.title}</h1>
            <p className="text-xl text-gray-400">Client: {project.client}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/20">
              <h2 className="text-lg font-bold text-red-400 mb-2">The Problem</h2>
              <p className="text-gray-300 leading-relaxed">{project.problem}</p>
            </div>
            <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20">
              <h2 className="text-lg font-bold text-green-400 mb-2">The Solution</h2>
              <p className="text-gray-300 leading-relaxed">{project.solution}</p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Key Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.metrics.map((metric, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-5 text-center border border-white/10">
                  <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">{metric.value}</div>
                  <div className="text-xs text-gray-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech, i) => (
                <span key={i} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20">{tech}</span>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Key Features</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {project.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
            <p className="text-lg leading-relaxed mb-4 italic">{project.testimonial.quote}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">{project.testimonial.author.charAt(0)}</div>
              <div>
                <p className="font-bold">{project.testimonial.author}</p>
                <p className="text-indigo-200 text-sm">{project.testimonial.role}</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Explore More Work</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {allProjects.filter(p => p.slug !== project.slug).slice(0, 3).map((related) => (
                <Link key={related.slug} href={`/work/${related.slug}`} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all">
                  {related.type === 'case-study' ? (
                    <img src={related.heroImage} alt={related.title} className="w-full h-32 object-contain bg-black group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <video
                      src={related.video}
                      poster={related.poster}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-32 object-contain bg-black group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="p-4">
                    <p className="font-bold text-white">{related.type === 'case-study' ? related.title : related.name}</p>
                    <p className="text-xs text-gray-400">{related.industry}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Ready for similar results?</h3>
            <Link href="/contact" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              Start Your Project
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // For video projects, render the video showcase page
  return (
    <div className="bg-gray-950 text-white min-h-screen pt-32 pb-24 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/work" className="text-blue-400 hover:text-blue-300 font-medium text-sm mb-8 inline-block">
          Back to Portfolio
        </Link>

        {/* Hero Video */}
        <div className="relative rounded-3xl overflow-hidden mb-10">
          <video
            src={project.video}
            poster={project.poster}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full aspect-video object-cover"
          />
        </div>

        {/* Project Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">{project.category}</span>
            <span className="text-sm text-gray-400">Industry: {project.industry}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">{project.name}</h1>
          <p className="text-2xl text-gray-400">{project.title}</p>
        </div>

        {/* Description */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">About This Project</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{project.description}</p>
        </div>

        {/* Video Showcase */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Project Demonstration</h2>
          <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10">
            <video
              src={project.video}
              poster={project.poster}
              controls
              playsInline
              className="w-full aspect-video object-cover"
            />
          </div>
        </div>

        {/* Key Highlights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What Makes This Special</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="text-2xl font-bold text-blue-400 mb-1">{project.category}</div>
              <div className="text-sm text-gray-400">Project Category</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="text-2xl font-bold text-purple-400 mb-1">{project.industry}</div>
              <div className="text-sm text-gray-400">Industry Focus</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="text-2xl font-bold text-green-400 mb-1">Responsive</div>
              <div className="text-sm text-gray-400">Works on all devices</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="text-2xl font-bold text-cyan-400 mb-1">Modern</div>
              <div className="text-sm text-gray-400">Latest technology stack</div>
            </div>
          </div>
        </div>

        {/* Related Projects */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Explore More Work</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {allProjects.filter(p => p.slug !== project.slug).slice(0, 3).map((related) => (
              <Link key={related.slug} href={`/work/${related.slug}`} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all">
                {related.type === 'case-study' ? (
                  <img src={related.heroImage} alt={related.title} className="w-full h-32 object-contain bg-black group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <video
                    src={related.video}
                    poster={related.poster}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-32 object-contain bg-black group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="p-4">
                  <p className="font-bold text-white">{related.type === 'case-study' ? related.title : related.name}</p>
                  <p className="text-xs text-gray-400">{related.industry}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Have a Similar Project in Mind?</h2>
          <p className="text-lg text-indigo-200 mb-6">Let's build something valuable together.</p>
          <Link href="/contact" className="inline-flex px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-gray-100">
            Start Your Project
          </Link>
        </div>
      </div>
    </div>
  )
}
