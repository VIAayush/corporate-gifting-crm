import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { advanceOrderStatus, assignSupplier, assignCourier } from '../actions'
import { ShoppingBag, ChevronRight, Truck, Printer, PackageCheck, AlertCircle } from 'lucide-react'

const STATUS_STEPS = ['received', 'planning', 'supplier_coordination', 'printing', 'quality_check', 'dispatch', 'delivered']

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'details' } = await searchParams
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const [
    { data: order },
    { data: orderItems },
    { data: history },
    { data: suppliers },
    { data: printingVendors },
    { data: courierPartners }
  ] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        company:companies(id, name),
        supplier:suppliers(id, name),
        printing_vendor:printing_vendors(id, name),
        courier_partner:courier_partners(id, name),
        quotation:quotations(id, quotation_number),
        requirement:requirements(id, name)
      `)
      .eq('id', id)
      .single(),
    supabase.from('order_items').select('*, product:products(id, name, sku)').eq('order_id', id),
    supabase.from('order_status_history').select('*, changer:profiles(id, full_name)').eq('order_id', id).order('created_at', { ascending: false }),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('printing_vendors').select('id, name').order('name'),
    supabase.from('courier_partners').select('id, name').order('name')
  ])

  if (!order) notFound()

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isDelivered = order.status === 'delivered'

  const handleAdvance = async () => {
    'use server'
    await advanceOrderStatus(order.id)
  }

  const handleAssignSupplier = async (formData: FormData) => {
    'use server'
    const sId = formData.get('supplier_id') as string
    await assignSupplier(order.id, sId)
  }

  const handleAssignCourier = async (formData: FormData) => {
    'use server'
    const cId = formData.get('courier_partner_id') as string
    const tracking = formData.get('tracking_number') as string
    await assignCourier(order.id, cId, tracking)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton href="/crm/orders" label="Back to Orders" />

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#4A235A]/10 text-[#4A235A] rounded-lg">
              <ShoppingBag size={16} />
            </span>
            <span className="font-mono text-xs font-bold text-gray-500">{order.order_number}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-[#4A235A] uppercase">
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order for {(order.company as any)?.name || 'Client'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            PO Ref: <span className="font-medium text-gray-700">{order.po_number || '?'}</span> ? 
            Expected Delivery: <span className="font-medium text-gray-700">{formatDate(order.expected_delivery_date)}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Order Value</p>
            <p className="text-xl font-bold text-[#4A235A]">{formatCurrency(order.order_value)}</p>
          </div>

          {!isDelivered && (
            <form action={handleAdvance}>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A235A] hover:bg-[#3d1c4a] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                Advance Stage <ChevronRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stage Progression Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fulfilment Progression</h3>
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
            <div 
              style={{ width: `${Math.max(8, (currentStepIndex + 1) / STATUS_STEPS.length * 100)}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4A235A] transition-all duration-500"
            />
          </div>
          <div className="grid grid-cols-7 text-center">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className={`text-[10px] font-semibold capitalize ${idx <= currentStepIndex ? 'text-[#4A235A]' : 'text-gray-400'}`}>
                {step.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {['details', 'products', 'vendors', 'financials', 'history'].map((t) => (
            <Link
              key={t}
              href={`?tab=${t}`}
              className={`pb-3 text-xs font-semibold capitalize transition-colors border-b-2 ${
                tab === t ? 'border-[#4A235A] text-[#4A235A]' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      {tab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-xs space-y-3">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b">Fulfillment & Shipping</h3>
            <div><span className="text-gray-500 w-32 inline-block">PO Number:</span> {order.po_number || '?'}</div>
            <div><span className="text-gray-500 w-32 inline-block">Dispatch Date:</span> {formatDate(order.dispatch_date)}</div>
            <div><span className="text-gray-500 w-32 inline-block">Courier Partner:</span> {(order.courier_partner as any)?.name || '?'}</div>
            <div><span className="text-gray-500 w-32 inline-block">Tracking / AWB:</span> {order.tracking_number || '?'}</div>
            <div><span className="text-gray-500 w-32 inline-block">Linked Quote:</span> {(order.quotation as any)?.quotation_number || '?'}</div>
            <div><span className="text-gray-500 w-32 inline-block">Linked Requirement:</span> {(order.requirement as any)?.name || '?'}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-xs space-y-3">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b">Operational Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {order.notes || 'No special operational instructions recorded for this order.'}
            </p>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3.5 font-semibold text-gray-500">Item</th>
                <th className="p-3.5 font-semibold text-gray-500 text-right">Qty</th>
                <th className="p-3.5 font-semibold text-gray-500 text-right">Unit Price</th>
                <th className="p-3.5 font-semibold text-gray-500 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderItems?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="p-3.5">
                    <div className="font-bold text-gray-900">{item.product?.name || 'Item'}</div>
                    <div className="text-gray-400 font-mono text-[10px]">{item.product?.sku}</div>
                  </td>
                  <td className="p-3.5 text-right font-medium">{item.quantity}</td>
                  <td className="p-3.5 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-3.5 text-right font-bold text-gray-900">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
              {(!orderItems || orderItems.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Assign Primary Supplier</h3>
            <form action={handleAssignSupplier} className="space-y-3">
              <select
                name="supplier_id"
                defaultValue={order.supplier_id || ''}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A235A] text-white text-xs font-semibold rounded-lg hover:bg-[#3d1c4a] transition-colors"
              >
                Save Supplier Assignment
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Courier & Dispatch Details</h3>
            <form action={handleAssignCourier} className="space-y-3">
              <select
                name="courier_partner_id"
                defaultValue={order.courier_partner_id || ''}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Select Courier Partner</option>
                {courierPartners?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                name="tracking_number"
                defaultValue={order.tracking_number || ''}
                placeholder="Tracking / AWB Number"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A235A] text-white text-xs font-semibold rounded-lg hover:bg-[#3d1c4a] transition-colors"
              >
                Save Shipping Info
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'financials' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-gray-900 pb-3 border-b">Order Financials & Profitability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Product Costs:</span>
                <span className="font-semibold">{formatCurrency(order.product_cost)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Printing & Branding:</span>
                <span className="font-semibold">{formatCurrency(order.printing_cost)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Courier & Logistics:</span>
                <span className="font-semibold">{formatCurrency(order.courier_cost)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Other Costs:</span>
                <span className="font-semibold">{formatCurrency(order.other_cost)}</span>
              </div>
              <div className="flex justify-between py-2 bg-gray-50 p-2.5 rounded-lg font-bold text-gray-900">
                <span>Total Cost:</span>
                <span>{formatCurrency(order.total_cost)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Selling Price (Order Value):</span>
                <span className="font-bold text-gray-900">{formatCurrency(order.order_value)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Gross Profit:</span>
                <span className="font-bold text-green-700">{formatCurrency(order.gross_profit)}</span>
              </div>
              <div className="flex justify-between py-2 bg-green-50 p-2.5 rounded-lg font-bold text-green-800">
                <span>Gross Margin:</span>
                <span>{order.order_value ? Math.round(((order.gross_profit || 0) / order.order_value) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-4">
            {history?.map((entry: any) => (
              <div key={entry.id} className="flex gap-3 text-xs">
                <div className="w-2.5 h-2.5 mt-1 rounded-full bg-[#4A235A] flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 capitalize">{entry.to_status?.replace('_', ' ')}</p>
                  <p className="text-gray-400 text-[10px]">
                    {formatDate(entry.created_at)} ? by {(entry.changer as any)?.full_name || 'Operations'}
                  </p>
                  {entry.note && <p className="text-gray-600 mt-1 bg-gray-50 p-2 rounded">{entry.note}</p>}
                </div>
              </div>
            ))}
            {(!history || history.length === 0) && (
              <p className="text-xs text-gray-400">No status changes logged yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
