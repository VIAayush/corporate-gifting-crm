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

export default async function QuotationDetailPage(props: { params: { id: string } }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: quote } = await supabase
    .from('quotations')
    .select(`
      *,
      company:companies(id, name),
      contact:contacts(id, full_name, email),
      requirement:requirements(id, title)
    `)
    .eq('id', params.id)
    .single()

  if (!quote) return <div className="p-6">Quotation not found</div>

  const { data: items } = await supabase
    .from('quotation_items')
    .select('*, product:products(id, name, sku)')
    .eq('quotation_id', quote.id)

  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date() && quote.status === 'sent'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
              {quote.quote_number || `QT-${quote.id.slice(0,6)}`}
            </h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status] || 'bg-gray-100 text-gray-800'}`}>
              {quote.status || 'unknown'}
            </span>
          </div>
          <p className="text-gray-500">Requirement: {quote.requirement?.title || '-'}</p>
        </div>
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Mark as Sent</button>
          )}
          {quote.status === 'sent' && (
            <>
              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Mark Accepted</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">Mark Rejected</button>
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300">Duplicate</button>
            </>
          )}
          {quote.status === 'accepted' && (
            <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm hover:opacity-90">Convert to Order</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-4">Client Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><dt className="text-gray-500">Company</dt><dd className="col-span-2 font-medium">{quote.company?.name || '-'}</dd></div>
            <div className="grid grid-cols-3"><dt className="text-gray-500">Contact</dt><dd className="col-span-2">{quote.contact?.full_name || '-'}</dd></div>
            <div className="grid grid-cols-3"><dt className="text-gray-500">Email</dt><dd className="col-span-2">{quote.contact?.email || '-'}</dd></div>
          </dl>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-4">Quote Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><dt className="text-gray-500">Created</dt><dd className="col-span-2">{formatDate(quote.created_at)}</dd></div>
            <div className="grid grid-cols-3">
              <dt className="text-gray-500">Valid Until</dt>
              <dd className={`col-span-2 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                {isExpired && ' (Expired)'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Item</th>
              <th className="p-4 font-medium text-gray-500 text-right">Qty</th>
              <th className="p-4 font-medium text-gray-500 text-right">Unit Price</th>
              <th className="p-4 font-medium text-gray-500 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items?.map((item: any) => (
              <tr key={item.id}>
                <td className="p-4">
                  <div className="font-medium">{item.product?.name || item.product_name || '-'}</div>
                  <div className="text-gray-500 text-xs">SKU: {item.product?.sku || '-'}</div>
                </td>
                <td className="p-4 text-right">{item.quantity}</td>
                <td className="p-4 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
            {!items?.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No items found.</td></tr>}
          </tbody>
        </table>
        
        <div className="bg-gray-50 p-6 border-t flex flex-col items-end space-y-2 text-sm">
          <div className="flex justify-between w-64"><span className="text-gray-500">Subtotal:</span><span>{formatCurrency(quote.subtotal || 0)}</span></div>
          {quote.discount_amount > 0 && <div className="flex justify-between w-64 text-green-600"><span>Discount:</span><span>-{formatCurrency(quote.discount_amount)}</span></div>}
          <div className="flex justify-between w-64"><span className="text-gray-500">Tax:</span><span>{formatCurrency(quote.tax_amount || 0)}</span></div>
          <div className="flex justify-between w-64 text-base font-semibold pt-2 border-t mt-2"><span>Total:</span><span>{formatCurrency(quote.total_amount || 0)}</span></div>
        </div>
      </div>

      {quote.terms_conditions && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-2">Terms & Conditions</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{quote.terms_conditions}</div>
        </div>
      )}
    </div>
  )
}