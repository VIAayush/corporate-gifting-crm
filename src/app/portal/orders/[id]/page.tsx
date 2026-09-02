import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShoppingBag, Truck, PackageCheck } from 'lucide-react'

const STAGES = ['received', 'planning', 'supplier_coordination', 'printing', 'quality_check', 'dispatch', 'delivered']

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: companyId } = await supabase.rpc('client_company_id')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      courier_partner:courier_partners(name, tracking_url),
      items:order_items(
        id, quantity, unit_price, line_total, product:products(name, sku, image_url)
      )
    `)
    .eq('id', id)
    .single()

  if (!order || order.company_id !== companyId) {
    notFound()
  }

  const currentStageIndex = STAGES.indexOf(order.status)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/portal/orders" label="Back to Orders" />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border">
                {order.order_number}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-[#4A235A] uppercase">
                {order.status?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Corporate Delivery Order</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Order Confirmed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Order Value</p>
            <p className="text-2xl font-bold text-[#4A235A]">{formatCurrency(order.order_value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Expected Delivery: <span className="font-bold text-gray-800">{formatDate(order.expected_delivery_date)}</span>
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Delivery Progress</h3>
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
              <div 
                style={{ width: `${Math.max(8, (currentStageIndex + 1) / STAGES.length * 100)}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4A235A] transition-all duration-500"
              />
            </div>
            <div className="grid grid-cols-7 text-center">
              {STAGES.map((stage, idx) => (
                <div key={stage} className={`text-[10px] font-semibold capitalize ${idx <= currentStageIndex ? 'text-[#4A235A]' : 'text-gray-400'}`}>
                  {stage.replace('_', ' ')}
                </div>
              ))}
            </div>
          </div>
          
          {order.tracking_number && (
            <div className="mt-4 bg-purple-50/50 p-4 rounded-xl flex items-center justify-between border border-purple-100 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-[#4A235A] rounded-lg">
                  <Truck size={16} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Shipment Dispatched</p>
                  <p className="text-gray-500 mt-0.5">
                    Courier: {(order.courier_partner as any)?.name || 'Air Express'} ? Tracking / AWB: <span className="font-mono font-bold text-gray-800">{order.tracking_number}</span>
                  </p>
                </div>
              </div>
              {(order.courier_partner as any)?.tracking_url && (
                <a 
                  href={(order.courier_partner as any).tracking_url.replace('{tracking}', order.tracking_number)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#4A235A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#3d1c4a] transition-colors"
                >
                  Track Package
                </a>
              )}
            </div>
          )}
        </div>

        {/* Ordered Items */}
        <div className="p-6">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Gifting Items in this Order</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{item.product?.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{item.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">{item.quantity} units</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
