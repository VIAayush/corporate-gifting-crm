import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function ReportsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab = searchParams.tab || 'sales'

  // Fetch some aggregate data for demonstration
  const [
    { data: orders },
    { data: invoices },
    { data: leads }
  ] = await Promise.all([
    supabase.from('orders').select('order_value, status, created_at'),
    supabase.from('invoices').select('amount, status'),
    supabase.from('leads').select('stage')
  ])

  // Simple aggregations
  const totalRevenue = orders?.filter(o => ['confirmed', 'in_production', 'dispatched', 'delivered'].includes(o.status)).reduce((sum, o) => sum + Number(o.order_value), 0) || 0
  const activeOrdersCount = orders?.filter(o => ['confirmed', 'in_production', 'dispatched'].includes(o.status)).length || 0
  const totalInvoiced = invoices?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
  const collected = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0
  
  const leadsByStage = leads?.reduce((acc: any, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Reports & Analytics</h1>
      
      <div className="flex gap-4 mb-6 border-b border-[var(--color-border)]">
        {['sales', 'orders', 'finance', 'samples'].map(t => (
          <a key={t} href={`?tab=${t}`} className={`pb-2 px-2 font-medium capitalize ${tab === t ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-black'}`}>
            {t}
          </a>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Booked Revenue</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Leads</p>
              <p className="text-2xl font-bold">{leads?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Conversion Rate (Est)</p>
              <p className="text-2xl font-bold text-blue-600">
                {leads?.length ? Math.round(((leadsByStage['client'] || 0) + (leadsByStage['regular_client'] || 0)) / leads.length * 100) : 0}%
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold mb-4">Leads by Stage</h3>
            <div className="w-full max-w-md">
              {Object.entries(leadsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center mb-2">
                  <div className="w-32 text-sm capitalize text-gray-600">{stage.replace('_', ' ')}</div>
                  <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                    <div className="bg-[var(--color-primary)] h-full" style={{ width: `${(Number(count) / (leads?.length || 1)) * 100}%` }}></div>
                  </div>
                  <div className="w-10 text-right text-sm font-medium">{String(count)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold">{orders?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Active Pipeline</p>
              <p className="text-2xl font-bold text-amber-600">{activeOrdersCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold mb-4 text-gray-500">Order analytics placeholder. In a real app, render charts using a library like Recharts.</h3>
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Invoiced</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(collected)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalInvoiced - collected)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'samples' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-12">
          <p className="text-gray-500">Detailed sample stock report coming soon.</p>
        </div>
      )}
    </div>
  )
}