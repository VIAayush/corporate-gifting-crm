import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: companyId } = await supabase.rpc('client_company_id')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        id, quantity, unit_price, line_total, product:products(name, sku)
      )
    `)
    .eq('id', id)
    .single()

  if (!order || order.company_id !== companyId) {
    notFound()
  }

  const STAGES = [
    'processing',
    'production',
    'quality_check',
    'dispatch',
    'delivered'
  ]
  const currentStageIndex = STAGES.indexOf(order.status)
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/portal/orders" className="text-[#4A235A] hover:underline text-sm font-medium flex items-center gap-1">
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Order {order.order_number}</h1>
            <p className="text-sm text-gray-500">Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Expected Delivery: {order.expected_delivery_date ? format(new Date(order.expected_delivery_date), 'MMM dd, yyyy') : 'Pending confirmation'}
            </p>
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        {order.status !== 'cancelled' && (
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">Order Progress</h3>
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#4A235A] -translate-y-1/2 z-0 transition-all duration-500" 
                style={{ width: `${Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100)}%` }}
              ></div>
              
              <div className="relative z-10 flex justify-between">
                {STAGES.map((stage, index) => (
                  <div key={stage} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                      index <= currentStageIndex 
                        ? 'bg-[#4A235A] border-[#4A235A] text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {index < currentStageIndex ? '✓' : index + 1}
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${
                      index <= currentStageIndex ? 'text-[#4A235A]' : 'text-gray-400'
                    }`}>
                      {stage.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {order.tracking_number && (
              <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Tracking Information</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Courier: {order.courier_partner_id || 'Standard'} | Tracking Number: <span className="font-mono bg-white px-2 py-0.5 rounded text-blue-900">{order.tracking_number}</span>
                  </p>
                </div>
                {order.tracking_link && (
                  <a 
                    href={order.tracking_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Track Package
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordered Items</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
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
                {order.items?.map((item: any) => (
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
          
          <div className="flex justify-end">
            <div className="w-full md:w-64 space-y-3 text-sm">
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total Amount</span>
                <span>${Number(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
