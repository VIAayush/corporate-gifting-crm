import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('*, owner:owner_id(full_name)').eq('id', params.id).single()
  
  if (!company) return <div>Company not found</div>

  const [
    { data: contacts },
    { data: leads },
    { data: orders },
    { data: requirements }
  ] = await Promise.all([
    supabase.from('contacts').select('*').eq('company_id', params.id),
    supabase.from('leads').select('*').eq('company_id', params.id),
    supabase.from('orders').select('*').eq('company_id', params.id).order('created_at', { ascending: false }),
    supabase.from('requirements').select('*').eq('company_id', params.id).order('created_at', { ascending: false })
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-3xl font-bold shrink-0">
          {getInitials(company.name)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-500 mt-1">{company.industry || 'No Industry'} • {company.city || 'No City'}, {company.country}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {company.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{leads?.length || 0}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Leads</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{requirements?.length || 0}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Requirements</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{orders?.length || 0}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Orders</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{contacts?.length || 0}</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Contacts</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Overview</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500 w-20 inline-block">Website:</span> {company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a> : '-'}</p>
              <p><span className="text-gray-500 w-20 inline-block">GST:</span> {company.gst_number || '-'}</p>
              <p><span className="text-gray-500 w-20 inline-block">Owner:</span> {company.owner?.full_name || '-'}</p>
              <div>
                <span className="text-gray-500 block mb-1">Address:</span>
                <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">{company.address || 'No address provided'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes || 'No notes.'}</p>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Recent Orders</h2>
            {orders && orders.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-sm font-medium text-gray-500">Order #</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Date</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Value</th>
                    <th className="pb-2 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-sm">
                        <Link href={`/crm/orders/${order.id}`} className="text-blue-600 hover:underline">{order.order_number}</Link>
                      </td>
                      <td className="py-2 text-sm">{formatDate(order.created_at)}</td>
                      <td className="py-2 text-sm font-medium">{formatCurrency(order.order_value)}</td>
                      <td className="py-2 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs capitalize">{order.status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">No orders yet.</p>
            )}
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h2 className="font-bold text-lg mb-4">Contacts</h2>
            {contacts && contacts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {contacts.map(contact => (
                  <div key={contact.id} className="p-3 border border-gray-200 rounded-lg">
                    <p className="font-semibold text-gray-900">{contact.first_name} {contact.last_name}</p>
                    <p className="text-xs text-gray-500 mb-2">{contact.designation || 'No title'}</p>
                    <p className="text-sm">{contact.email || '-'}</p>
                    <p className="text-sm">{contact.phone || '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No contacts added.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}