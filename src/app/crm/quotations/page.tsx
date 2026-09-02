import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-amber-100 text-amber-800'
}

export default async function QuotationsPage(props: { searchParams: { status?: string } }) {
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status || 'all'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase
    .from('quotations')
    .select('*, company:companies(id, name), owner:profiles(id, full_name), requirement:requirements(id, title)')
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: quotations, error } = await query

  const statuses = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired']

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Quotations</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90">
          Create Quote
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {statuses.map(status => (
          <Link 
            key={status}
            href={`/crm/quotations?status=${status}`}
            className={`px-4 py-2 font-medium text-sm capitalize ${statusFilter === status ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {status}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Quote #</th>
              <th className="p-4 font-medium text-gray-500">Company</th>
              <th className="p-4 font-medium text-gray-500">Requirement</th>
              <th className="p-4 font-medium text-gray-500">Total</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500">Valid Until</th>
              <th className="p-4 font-medium text-gray-500">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotations?.map((quote: any) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <Link href={`/crm/quotations/${quote.id}`} className="text-blue-600 hover:underline font-medium">
                    {quote.quote_number || `QT-${quote.id.slice(0,6)}`}
                  </Link>
                </td>
                <td className="p-4">{quote.company?.name || '-'}</td>
                <td className="p-4">{quote.requirement?.title || '-'}</td>
                <td className="p-4 font-medium">{formatCurrency(quote.total_amount || 0)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status] || 'bg-gray-100 text-gray-800'}`}>
                    {quote.status || 'unknown'}
                  </span>
                </td>
                <td className="p-4">
                  {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                </td>
                <td className="p-4">{quote.owner?.full_name || '-'}</td>
              </tr>
            ))}
            {!quotations?.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">No quotations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}