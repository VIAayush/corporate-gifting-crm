import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function PortalQuotationsPage() {
  const supabase = await createClient()

  const { data: companyId } = await supabase.rpc('client_company_id')

  // Explicit column list: internal notes, owner and margin fields must never reach a client.
  const { data: quotations } = companyId
    ? await supabase
        .from('quotations')
        .select('id, quotation_number, status, total, valid_until, created_at')
        .eq('company_id', companyId)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
        <p className="mt-2 text-gray-600">Review and approve quotations for your requirements.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {quotations?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No quotations available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Quote #</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Valid Until</th>
                  <th className="px-6 py-4 font-semibold">Total Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotations?.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono">
                      {quote.quotation_number}
                    </td>
                    <td className="px-6 py-4">{formatDate(quote.created_at)}</td>
                    <td className="px-6 py-4">{formatDate(quote.valid_until)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(quote.status || 'sent').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/portal/quotations/${quote.id}`}
                        className="text-[#4A235A] hover:text-[#3d1c4a] font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
