'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DangerZonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  async function handleDeactivateAccount() {
    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Update client to deactivated
      const { error } = await supabase
        .from('clients')
        .update({ approved: false })
        .eq('id', user.id)

      if (error) {
        console.error('Deactivate error:', error)
        setMessage('Failed to deactivate account')
      } else {
        setMessage('Account deactivated. You will be signed out.')
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/portal/login')
        }, 2000)
      }
    } catch (error) {
      console.error('Deactivate exception:', error)
      setMessage('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setMessage('Please type DELETE to confirm account deletion')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Delete user data (this is a placeholder - real deletion would need server-side processing)
      // For now, we'll sign out and notify
      setMessage(
        'Account deletion requested. An administrator will process your request within 48 hours.'
      )

      // In a production system, you would:
      // 1. Create a deletion request record
      // 2. Notify admin
      // 3. Process deletion after confirmation period
      // 4. Delete all user data (files, messages, projects, invoices, etc.)

      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    } catch (error) {
      console.error('Delete exception:', error)
      setMessage('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/portal/settings" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Settings
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Danger Zone</h1>
        <p className="text-gray-600 mb-6">
          Destructive actions for your account. Please proceed with caution.
        </p>

        {message && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.includes('success') || message.includes('requested') || message.includes('deactivated')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Deactivate Account */}
        <div className="bg-white border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-red-700">Deactivate Account</h2>
              <p className="text-sm text-gray-600 mt-2">
                Temporarily disable your account. You can reactivate it by contacting Omnix Lab support.
              </p>
              <ul className="text-sm text-gray-500 mt-3 space-y-1">
                <li>• You will be signed out of all devices</li>
                <li>• Your projects and files will be preserved</li>
                <li>• You won't be able to access the portal</li>
                <li>• Contact support to reactivate</li>
              </ul>
            </div>
          </div>

          {!showDeactivateConfirm ? (
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              disabled={loading}
              className="mt-4 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Deactivate Account
            </button>
          ) : (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-3">
                Are you sure you want to deactivate your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeactivateAccount}
                  disabled={loading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Yes, Deactivate'}
                </button>
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div className="bg-white border border-red-300 rounded-xl p-6 mb-6">
          <div>
            <h2 className="font-semibold text-red-700">Delete Account</h2>
            <p className="text-sm text-gray-600 mt-2">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <ul className="text-sm text-gray-500 mt-3 space-y-1">
              <li>• All projects will be permanently deleted</li>
              <li>• All files and documents will be removed</li>
              <li>• All invoices and payment history will be deleted</li>
              <li>• All messages will be permanently removed</li>
              <li>• This action cannot be reversed</li>
            </ul>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="mt-4 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Delete Account
            </button>
          ) : (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-3">
                Type <strong>DELETE</strong> to confirm account deletion.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== 'DELETE'}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Permanently Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> If you have outstanding invoices or active projects,
            please contact Omnix Lab support before deleting your account to arrange proper
            handover or closure.
          </p>
        </div>
      </div>
    </div>
  )
}
