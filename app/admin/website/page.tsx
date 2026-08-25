'use client'

export default function AdminWebsitePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Website</h1>
        <p className="text-sm text-gray-400 mt-1">Website content management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">[ ]</p>
          <h3 className="text-lg font-semibold text-white">Blog Posts</h3>
          <p className="text-sm text-gray-400 mt-1">Manage blog content</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">[ ]</p>
          <h3 className="text-lg font-semibold text-white">Services</h3>
          <p className="text-sm text-gray-400 mt-1">Manage service offerings</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">[ ]</p>
          <h3 className="text-lg font-semibold text-white">Work Portfolio</h3>
          <p className="text-sm text-gray-400 mt-1">Manage case studies</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Website Leads</h3>
        <p className="text-sm text-gray-400">
          Leads from the public website are managed in the Leads section.
        </p>
      </div>
    </div>
  )
}