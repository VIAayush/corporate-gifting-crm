import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CLIENT_STATUS_LABELS } from '@/lib/order-workflow'

export default async function PortalOrdersPage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, created_at, expected_delivery_date, order_value, status, campaign:campaign_id(name, employee_quantity)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-gray-600">Track only your organisation&apos;s campaigns and deliveries.</p>
      </div>

      <div className="grid gap-4">
        {(orders || []).map((order) => {
          const campaign = Array.isArray(order.campaign) ? order.campaign[0] : order.campaign
          return (
            <Link key={order.id} href={`/portal/orders/${order.id}`} className="block bg-white rounded-2xl border p-5 hover:border-[#1A3022]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-serif text-lg">{campaign?.name || order.order_number}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{order.order_number}</p>
                  {campaign?.employee_quantity && (
                    <p className="text-xs text-gray-500 mt-1">{Number(campaign.employee_quantity).toLocaleString('en-IN')} employees</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold">{formatCurrency(order.order_value)}</p>
                  <p className="text-xs text-gray-500">Expected {formatDate(order.expected_delivery_date)}</p>
                  <p className="text-xs font-medium text-[#1A3022] mt-1">{CLIENT_STATUS_LABELS[order.status] || order.status}</p>
                </div>
              </div>
            </Link>
          )
        })}
        {(!orders || orders.length === 0) && (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border">No orders found.</div>
        )}
      </div>
    </div>
  )
}
