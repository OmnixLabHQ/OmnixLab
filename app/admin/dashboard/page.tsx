import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Fetch stats with fallback to 0 on error
  const getCount = async (table: string) => {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    return error ? 0 : count ?? 0
  }

  const [clientCount, projectCount, messageCount, fileCount, invoiceCount] = await Promise.all([
    getCount('clients'),
    getCount('projects'),
    getCount('messages'),
    getCount('files'),
    getCount('invoices'),
  ])

  // Fetch recent data with error handling
  const { data: recentClients } = await supabase
    .from('clients')
    .select('full_name, company, email, approved, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, clients(full_name, company, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentFiles } = await supabase
    .from('files')
    .select('*, clients(full_name, company, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('*, clients(full_name, company, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Clients', value: clientCount, href: '/admin/clients' },
    { label: 'Projects', value: projectCount, href: '/admin/projects' },
    { label: 'Messages', value: messageCount, href: '/admin/chat' },
    { label: 'Files', value: fileCount, href: '/admin/files' },
    { label: 'Invoices', value: invoiceCount, href: '/admin/invoices' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Recent Clients</h2>
          {recentClients && recentClients.length > 0 ? (
            recentClients.map((client: any) => (
              <div key={client.id} className="flex justify-between items-start border-b pb-2 mb-2">
                <div>
                  <p className="font-medium">{client.full_name}</p>
                  <p className="text-sm text-gray-500">{client.company} · {client.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {client.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No clients yet.</p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Recent Messages</h2>
          {recentMessages && recentMessages.length > 0 ? (
            recentMessages.map((msg: any) => (
              <div key={msg.id} className="border-b pb-2 mb-2">
                <div className="flex justify-between">
                  <p className="font-medium">{msg.clients?.full_name || 'Unknown'}</p>
                  <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No messages yet.</p>
          )}
        </div>

        {/* Recent Files */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Recent Files</h2>
          {recentFiles && recentFiles.length > 0 ? (
            recentFiles.map((file: any) => (
              <div key={file.id} className="flex justify-between items-center border-b pb-2 mb-2">
                <div>
                  <p className="font-medium">{file.file_name}</p>
                  <p className="text-sm text-gray-500">{file.clients?.full_name || 'Unknown'}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No files yet.</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Recent Invoices</h2>
          {recentInvoices && recentInvoices.length > 0 ? (
            recentInvoices.map((inv: any) => (
              <div key={inv.id} className="flex justify-between items-center border-b pb-2 mb-2">
                <div>
                  <p className="font-medium">INV-{inv.id}</p>
                  <p className="text-sm text-gray-500">{inv.clients?.full_name || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${inv.amount?.toLocaleString()}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No invoices yet.</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4">
        <Link href="/admin/clients" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Manage Clients</Link>
        <Link href="/admin/projects" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Manage Projects</Link>
        <Link href="/admin/chat" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Open Chat Inbox</Link>
        <Link href="/admin/invoices" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">Manage Invoices</Link>
      </div>
    </div>
  )
}