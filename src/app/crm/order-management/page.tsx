import { createClient } from '@/lib/supabase/server'
import { formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OrderManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase.from('orders').select('*, companies(name), owner:owner_id(full_name)').neq('status', 'delivered').order('expected_delivery', { ascending: true })

  const active = orders?.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length || 0
  const inProduction = orders?.filter(o => o.status === 'in_production').length || 0
  const dispatched = orders?.filter(o => o.status === 'dispatched').length || 0

  const groupedOrders = orders?.reduce((acc: any, order) => {
    if (!acc[order.status]) acc[order.status] = []
    acc[order.status].push(order)
    return acc
  }, {}) || {}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Order Management</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm">
          <p className="text-sm text-[var(--color-text-secondary)]">Active Orders</p>
          <p className="text-xl font-semibold">{active}</p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
          <p className="text-sm text-amber-800">In Production</p>
          <p className="text-xl font-semibold text-amber-900">{inProduction}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <p className="text-sm text-blue-800">Dispatched</p>
          <p className="text-xl font-semibold text-blue-900">{dispatched}</p>
        </div>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {['confirmed', 'in_production', 'dispatched'].map(status => (
          <div key={status} className="min-w-[320px] bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-4 capitalize">{status.replace('_', ' ')} <span className="text-xs text-gray-500 font-normal ml-2">{groupedOrders[status]?.length || 0}</span></h2>
            <div className="flex flex-col gap-3">
              {groupedOrders[status]?.map((order: any) => {
                const daysRemaining = Math.ceil((new Date(order.expected_delivery).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                const isOverdue = daysRemaining < 0
                return (
                  <Link href={`/crm/orders/${order.id}`} key={order.id}>
                    <div className={`p-4 bg-white rounded-lg shadow-sm border ${isOverdue ? 'border-red-500' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-[var(--color-primary)]">{order.order_number}</span>
                        <div title={order.owner?.full_name} className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs">
                          {getInitials(order.owner?.full_name)}
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">{order.companies?.name}</p>
                      <div className="flex justify-between items-end mt-4">
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Due: {formatDate(order.expected_delivery)}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {(!groupedOrders[status] || groupedOrders[status].length === 0) && (
                <p className="text-sm text-gray-400 italic text-center py-4">No orders</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}