import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function PortalCampaignsPage() {
  const supabase = await createClient()
  const { data: companyId } = await supabase.rpc('client_company_id')
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, employee_quantity, budget_per_employee, total_budget, required_delivery_date, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Campaigns</h1>
      <div className="space-y-3">
        {(campaigns || []).map((c) => (
          <div key={c.id} className="bg-white border rounded-2xl p-5">
            <p className="font-serif text-lg">{c.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {c.employee_quantity?.toLocaleString('en-IN')} employees · {formatCurrency(c.budget_per_employee)} per person · {formatCurrency(c.total_budget)} total
            </p>
            <p className="text-xs mt-1">Delivery {formatDate(c.required_delivery_date)}</p>
            <div className="flex gap-4 mt-2">
              <Link href={`/portal/catalogue?campaign=${c.id}`} className="text-xs text-[#1A3022] underline">View published products</Link>
              <Link href="/portal/orders" className="text-xs text-[#1A3022] underline">View related orders</Link>
            </div>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && <p className="text-gray-500">No published campaigns.</p>}
      </div>
    </div>
  )
}
