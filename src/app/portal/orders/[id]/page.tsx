import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_LIFECYCLE, CLIENT_STATUS_LABELS, lifecycleIndex } from '@/lib/order-workflow'
import { Truck } from 'lucide-react'

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: companyId } = await supabase.rpc('client_company_id')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, order_value, expected_delivery_date, created_at, tracking_number, company_id, campaign_id,
      campaign:campaign_id(name, employee_quantity),
      courier_partner:courier_partners(name, tracking_url),
      items:order_items(id, quantity, unit_price, line_total, product:products(name, sku, image_url))
    `)
    .eq('id', id)
    .single()

  if (!order || order.company_id !== companyId) {
    notFound()
  }

  const currentStageIndex = lifecycleIndex(order.status)
  const campaign = Array.isArray(order.campaign) ? order.campaign[0] : order.campaign

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/portal/orders" label="Back to Orders" />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-gray-500">{order.order_number}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {campaign?.name || 'My order'}
            </h1>
            {campaign?.employee_quantity && (
              <p className="text-xs text-gray-500 mt-1">{campaign.employee_quantity.toLocaleString('en-IN')} employees</p>
            )}
            <p className="text-sm mt-2 font-medium text-[#1A3022]">
              Current status: {CLIENT_STATUS_LABELS[order.status] || order.status}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Order value</p>
            <p className="text-2xl font-bold text-[#1A3022]">{formatCurrency(order.order_value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Expected delivery: {formatDate(order.expected_delivery_date)}</p>
          </div>
        </div>

        <div className="p-6 border-b space-y-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Timeline</h3>
          <ol className="space-y-2">
            {ORDER_LIFECYCLE.map((stage, idx) => {
              const done = idx < currentStageIndex || order.status === 'delivered'
              const current = idx === currentStageIndex && order.status !== 'delivered'
              return (
                <li key={stage} className={`text-sm ${done || current ? 'text-[#1A3022]' : 'text-gray-400'}`}>
                  {done ? '✓' : current ? '●' : '○'} {CLIENT_STATUS_LABELS[stage]}
                </li>
              )
            })}
          </ol>
        </div>

        {order.tracking_number && (
          <div className="px-6 pb-4">
            <div className="bg-emerald-50 p-4 rounded-xl flex items-center gap-3 text-xs">
              <Truck size={16} />
              <div>
                Dispatched via {(order.courier_partner as { name?: string })?.name || 'courier'} · AWB {order.tracking_number}
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <h3 className="text-xs font-bold uppercase mb-3">Items</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-gray-500">
              <th className="py-2">Product</th><th>Qty</th><th className="text-right">Amount</th>
            </tr></thead>
            <tbody>
              {order.items?.map((item: { id: string; quantity: number; unit_price: number; line_total: number; product?: { name?: string } }) => (
                <tr key={item.id} className="border-t">
                  <td className="py-2">{item.product?.name}</td>
                  <td>{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.line_total ?? item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
