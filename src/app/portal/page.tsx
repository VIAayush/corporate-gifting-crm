import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { CLIENT_STATUS_LABELS } from '@/lib/order-workflow'

export default async function PortalHomePage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')
  const [{ data: orders }, { data: quotes }, { data: campaigns }] = await Promise.all([
    supabase.from('orders').select('id, order_number, status, order_value, campaign:campaign_id(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(6),
    supabase.from('quotations').select('id, quotation_number, status, total').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    supabase.from('campaigns').select('id, name, total_budget, employee_quantity').eq('company_id', companyId).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your campaigns, quotations, and live order status.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">Campaigns</p><p className="text-2xl font-semibold">{campaigns?.length || 0}</p></div>
        <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">Open quotations</p><p className="text-2xl font-semibold">{quotes?.length || 0}</p></div>
        <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">Orders</p><p className="text-2xl font-semibold">{orders?.length || 0}</p></div>
      </div>
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex justify-between mb-3">
          <h2 className="font-serif text-lg">My orders</h2>
          <Link href="/portal/orders" className="text-xs underline">View all</Link>
        </div>
        {(orders || []).map((o) => {
          const campaign = Array.isArray(o.campaign) ? o.campaign[0] : o.campaign
          return (
            <Link key={o.id} href={`/portal/orders/${o.id}`} className="flex justify-between py-2 border-t text-sm">
              <span>{campaign?.name || o.order_number}</span>
              <span>{CLIENT_STATUS_LABELS[o.status] || o.status} · {formatCurrency(o.order_value)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
