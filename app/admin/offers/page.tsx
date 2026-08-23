import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminOffersPage() {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(full_name, company)')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase.from('clients').select('id, full_name, company')

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Offers & Invoices</h1>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">Create Invoice / Offer</h2>
        <form action="/api/admin/create-invoice" method="POST" className="space-y-4">
          <select name="client_id" required className="w-full px-4 py-2 border rounded-xl">
            <option value="">Select Client</option>
            {clients?.map(client => (
              <option key={client.id} value={client.id}>{client.full_name} — {client.company}</option>
            ))}
          </select>
          <input name="amount" type="number" placeholder="Amount" required className="w-full px-4 py-2 border rounded-xl" />
          <input name="description" placeholder="Description" required className="w-full px-4 py-2 border rounded-xl" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Create Invoice</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">All Invoices</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3">Invoice #</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">INV-{inv.id}</td>
                <td className="py-2 px-3">{inv.clients?.full_name}</td>
                <td className="py-2 px-3">${inv.amount?.toLocaleString()}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}