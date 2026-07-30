import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        <p className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</p>
        <p className="text-gray-500 mt-2 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="inline-flex px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}