import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  planning: 'bg-purple-100 text-purple-800',
  supplier_coordination: 'bg-orange-100 text-orange-800',
  printing: 'bg-amber-100 text-amber-800',
  quality_check: 'bg-yellow-100 text-yellow-800',
  dispatch: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800'
}

const STATUS_STEPS = ['received', 'planning', 'supplier_coordination', 'printing', 'quality_check', 'dispatch', 'delivered']

export default async function OrderDetailPage(props: { params: { id: string }, searchParams: { tab?: string } }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const tab = searchParams.tab || 'details'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      company:companies(id, name),
      supplier:suppliers!orders_supplier_id_fkey(id, name),
      printing_vendor:suppliers!orders_printing_vendor_id_fkey(id, name),
      courier_partner:suppliers!orders_courier_partner_id_fkey(id, name),
      quotation:quotations(id, quote_number),
      requirement:requirements(id, title)
    `)
    .eq('id', params.id)
    .single()

  if (!order) return <div className="p-6">Order not found</div>

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, product:products(id, name, sku)')
    .eq('order_id', order.id)

  const { data: history } = await supabase
    .from('order_status_history')
    .select('*, changer:profiles(id, full_name)')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
            {order.order_number || `ORD-${order.id.slice(0,6)}`}
          </h1>
          <p className="text-gray-500 mt-1">Company: {order.company?.name || '-'}</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-sm text-gray-500">Order Value</div>
            <div className="font-semibold">{formatCurrency(order.order_value || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Expected Delivery</div>
            <div className="font-semibold">{order.expected_delivery_date ? formatDate(order.expected_delivery_date) : '-'}</div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
            {(order.status || 'unknown').replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-8">
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
            <div 
              style={{ width: `${Math.max(5, (currentStepIndex + 1) / STATUS_STEPS.length * 100)}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[var(--color-primary)] transition-all"
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className={`text-center ${idx <= currentStepIndex ? 'text-[var(--color-primary)] font-medium' : ''}`}>
                {step.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {['details', 'products', 'financials', 'history'].map(t => (
          <Link 
            key={t}
            href={`/crm/orders/${order.id}?tab=${t}`}
            className={`px-4 py-2 font-medium text-sm capitalize ${tab === t ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === 'details' && (
        <div className="bg-white rounded-lg border p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Fulfillment Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">PO Number</dt><dd className="col-span-2">{order.po_number || '-'}</dd></div>
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">Supplier</dt><dd className="col-span-2">{order.supplier?.name || '-'}</dd></div>
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">Printer</dt><dd className="col-span-2">{order.printing_vendor?.name || '-'}</dd></div>
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">Courier</dt><dd className="col-span-2">{order.courier_partner?.name || '-'}</dd></div>
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">Dispatch Date</dt><dd className="col-span-2">{order.dispatch_date ? formatDate(order.dispatch_date) : '-'}</dd></div>
              <div className="grid grid-cols-3 gap-4"><dt className="text-gray-500">Tracking #</dt><dd className="col-span-2">{order.tracking_number || '-'}</dd></div>
            </dl>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Notes</h3>
            <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
              {order.notes || 'No notes added.'}
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">SKU</th>
                <th className="p-4 font-medium text-gray-500">Product</th>
                <th className="p-4 font-medium text-gray-500 text-right">Qty</th>
                <th className="p-4 font-medium text-gray-500 text-right">Unit Price</th>
                <th className="p-4 font-medium text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orderItems?.map((item: any) => (
                <tr key={item.id}>
                  <td className="p-4 text-gray-500">{item.product?.sku || '-'}</td>
                  <td className="p-4 font-medium">{item.product?.name || item.product_name || '-'}</td>
                  <td className="p-4 text-right">{item.quantity}</td>
                  <td className="p-4 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
              {!orderItems?.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No items found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'financials' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-gray-900 mb-6">Financial Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Product Costs</span><span>{formatCurrency(order.actual_product_cost || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Printing Costs</span><span>{formatCurrency(order.actual_printing_cost || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Courier Costs</span><span>{formatCurrency(order.actual_courier_cost || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Other Costs</span><span>{formatCurrency(order.actual_other_costs || 0)}</span></div>
              <div className="flex justify-between py-2 bg-gray-50 p-2 rounded font-medium"><span>Total Cost</span><span>{formatCurrency(order.total_cost || 0)}</span></div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Selling Price</span><span className="font-medium text-lg">{formatCurrency(order.order_value || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Gross Profit</span><span className="text-green-600 font-medium">{formatCurrency(order.gross_profit || 0)}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Margin</span><span className="text-green-600 font-medium">{order.margin_percentage ? `${order.margin_percentage}%` : '0%'}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-6">
            {history?.map((entry: any, i: number) => (
              <div key={entry.id} className="relative flex gap-4">
                {i !== history.length - 1 && <div className="absolute top-6 bottom-[-24px] left-2 w-px bg-gray-200"></div>}
                <div className="w-4 h-4 mt-1 rounded-full bg-[var(--color-primary)] flex-shrink-0 z-10"></div>
                <div>
                  <div className="font-medium text-gray-900 capitalize">{entry.status.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(entry.created_at)} by {entry.changer?.full_name || 'System'}
                  </div>
                  {entry.notes && <div className="text-sm mt-2 p-2 bg-gray-50 rounded">{entry.notes}</div>}
                </div>
              </div>
            ))}
            {!history?.length && <div className="text-gray-500">No history available.</div>}
          </div>
        </div>
      )}
    </div>
  )
}