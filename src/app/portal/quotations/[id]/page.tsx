import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { QuotationActions } from './QuotationActions'

export default async function PortalQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: companyId } = await supabase.rpc('client_company_id')

  const { data: quote } = await supabase
    .from('quotations')
    .select(`
      *,
      items:quotation_items(
        id, quantity, unit_price, line_total, product:products(name, sku)
      )
    `)
    .eq('id', id)
    .single()

  if (!quote || quote.company_id !== companyId) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/portal/quotations" className="text-[#4A235A] hover:underline text-sm font-medium flex items-center gap-1">
          ← Back to Quotations
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Quotation {quote.quotation_number}</h1>
            <p className="text-sm text-gray-500">Date: {format(new Date(quote.created_at), 'MMMM dd, yyyy')}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-2 ${
              quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
              quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
              quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {quote.status.toUpperCase()}
            </span>
            <p className="text-sm text-gray-600">
              Valid until: {quote.valid_until ? format(new Date(quote.valid_until), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold text-center">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quote.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{item.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
              {quote.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap border border-gray-200">
                    {quote.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-64 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${Number(quote.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-${Number(quote.discount_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${Number(quote.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>${Number(quote.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {quote.status === 'sent' && (
            <QuotationActions quotationId={quote.id} />
          )}
        </div>
      </div>
    </div>
  )
}
