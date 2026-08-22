'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Unable to sign you in. The email or password you entered is incorrect.')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: client } = await supabase
        .from('clients')
        .select('approved')
        .eq('id', data.user.id)
        .single()

      if (!client?.approved) {
        await supabase.auth.signOut()
        setError('Your account is pending approval. You will be notified once approved.')
        setLoading(false)
        return
      }

      router.push('/portal/dashboard?welcome=1')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-950">
      {/* Left visual panel */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] overflow-hidden">
        {/* Background image/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black" />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        {/* Soft glow */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        {/* Particles - subtle */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              OMNIX LAB
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4">Build what's next.</h2>
            <p className="text-gray-300 text-lg">
              Securely access your projects, files, payments, ideas, and collaboration workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="px-3 py-1 bg-white/10 rounded-full">Projects</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Files</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Payments</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Communication</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            © 2026 Omnix Lab. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right authentication panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo (visible only on small screens) */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="w-2 h-2 bg-indigo-600 rounded-full" />
              OMNIX LAB
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to your Omnix Lab account</p>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="/portal/forgot-password" className="text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing you in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a href="/portal/register" className="text-indigo-600 font-medium hover:underline">
              Create your account
            </a>
          </p>

          {/* Security notice */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secure authentication. Your information is protected.
          </div>
        </div>
      </div>
    </div>
  )
}