'use client'

import Link from 'next/link'

export default function SupportWidget() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
      <p className="text-sm text-gray-600 mb-4">
        Our team is available to help with your project.
      </p>
      <div className="space-y-3">
        <Link
          href="/portal/messages"
          className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
        >
          💬 Message Omnix Lab
        </Link>
        <Link
          href="/portal/ideas"
          className="block w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors text-center"
        >
          ✨ Share an Idea
        </Link>
        <Link
          href="/portal/files"
          className="block w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors text-center"
        >
          📁 Upload a File
        </Link>
      </div>
    </div>
  )
}
