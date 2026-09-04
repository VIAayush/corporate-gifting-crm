import { createClient } from '@/lib/supabase/server'
import { requireStaff, applyOrderScope, canChangeOrderStage } from '@/lib/auth'
import { formatCurrency, formatDate, asRows, oneRelation } from '@/lib/utils'
import {
  ORDER_LIFECYCLE,
  ORDER_STATUS_LABELS,
  orderHealth,
  HEALTH_LABELS,
  HEALTH_STYLES,
} from '@/lib/order-workflow'
import Link from 'next/link'
import { OrderKanban } from '@/components/orders/order-kanban'

type NamedRef = { id?: string; name?: string | null; full_name?: string | null }
type ControlOrder = {
  id: string
  order_number: string | null
  order_value: number | null
  status: string
  expected_delivery_date: string | null
  updated_at?: string | null
  priority?: string | null
  stage_due_at: string | null
  assigned_to?: string | null
  current_department_id?: string | null
  campaign_id?: string | null
  company?: NamedRef | NamedRef[] | null
  assignee?: NamedRef | NamedRef[] | null
  department?: NamedRef | NamedRef[] | null
  campaign?: NamedRef | NamedRef[] | null
}

export default async function OrderControlCenterPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string
    department?: string
    employee?: string
    stage?: string
    health?: string
    sort?: string
    view?: string
    from?: string
    to?: string
  }>
}) {
  const profile = await requireStaff(['admin', 'operations', 'management', 'sales', 'accounts'])
  const params = await searchParams
  const supabase = await createClient()
  const view = params.view === 'kanban' ? 'kanban' : 'table'

  const [{ data: companies }, { data: departments }, { data: staff }] = await Promise.all([
    supabase.from('companies').select('id, name').order('name'),
    supabase.from('departments').select('id, name, slug').order('name'),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).in('role', ['admin', 'sales', 'operations', 'accounts', 'management']).order('full_name'),
  ])

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, order_value, status, expected_delivery_date, updated_at, priority, stage_due_at, assigned_to, current_department_id, campaign_id,
      company:companies(id, name),
      assignee:assigned_to(id, full_name),
      department:current_department_id(id, name),
      campaign:campaign_id(id, name)
    `)

  query = applyOrderScope(query, profile)

  if (params.client) query = query.eq('company_id', params.client)
  if (params.department) query = query.eq('current_department_id', params.department)
  if (params.employee) query = query.eq('assigned_to', params.employee)
  if (params.stage) query = query.eq('status', params.stage)
  if (params.from) query = query.gte('expected_delivery_date', params.from)
  if (params.to) query = query.lte('expected_delivery_date', params.to)

  const sort = params.sort || 'delivery'
  if (sort === 'value') query = query.order('order_value', { ascending: false })
  else if (sort === 'updated') query = query.order('updated_at', { ascending: false })
  else if (sort === 'priority') query = query.order('priority', { ascending: true })
  else query = query.order('expected_delivery_date', { ascending: true, nullsFirst: false })

  const { data: orders } = await query.limit(200)
  const orderRows = asRows<ControlOrder>(orders)

  const rows = orderRows.map((o: ControlOrder) => {
    const health = orderHealth(o.status, o.expected_delivery_date, o.stage_due_at)
    return { ...o, health }
  }).filter((o) => !params.health || o.health === params.health)

  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v && k !== 'view') qs.set(k, v)
  })
  const filterQuery = qs.toString()
  const tableHref = filterQuery ? `/crm/order-management?${filterQuery}` : '/crm/order-management'
  const kanbanHref = filterQuery ? `/crm/order-management?${filterQuery}&view=kanban` : '/crm/order-management?view=kanban'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Order Control Center</h1>
          <p className="text-xs text-[#7A7267] mt-1">Who owns each order right now, and whether it is healthy.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href={tableHref} className={`px-3 py-1.5 rounded-lg border ${view === 'table' ? 'bg-[#1A3022] text-white border-[#1A3022]' : 'bg-white'}`}>Table</Link>
          <Link href={kanbanHref} className={`px-3 py-1.5 rounded-lg border ${view === 'kanban' ? 'bg-[#1A3022] text-white border-[#1A3022]' : 'bg-white'}`}>Kanban</Link>
        </div>
      </div>

      <form className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 bg-white p-4 rounded-2xl border border-[#E5DFD5]">
        {view === 'kanban' && <input type="hidden" name="view" value="kanban" />}
        <select name="client" defaultValue={params.client || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="">All clients</option>
          {(companies || []).map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="department" defaultValue={params.department || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="">All departments</option>
          {(departments || []).map((d: { id: string; name: string }) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select name="employee" defaultValue={params.employee || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="">All employees</option>
          {(staff || []).map((s: { id: string; full_name: string | null }) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <select name="stage" defaultValue={params.stage || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="">All stages</option>
          {ORDER_LIFECYCLE.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          <option value="cancelled">Cancelled</option>
        </select>
        <select name="health" defaultValue={params.health || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="">All health</option>
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="delayed">Delayed</option>
        </select>
        <input type="date" name="from" defaultValue={params.from || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]" />
        <input type="date" name="to" defaultValue={params.to || ''} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]" />
        <select name="sort" defaultValue={params.sort || 'delivery'} className="text-xs border rounded-lg px-2 py-2 bg-[#FAF7F2]">
          <option value="delivery">Delivery date</option>
          <option value="value">Order value</option>
          <option value="updated">Last updated</option>
          <option value="priority">Priority</option>
        </select>
        <button className="text-xs font-semibold bg-[#1A3022] text-white rounded-lg px-3">Apply</button>
      </form>

      {view === 'kanban' ? (
        <OrderKanban
          canDrag={canChangeOrderStage(profile.role)}
          orders={rows.map((o) => {
            const company = oneRelation(o.company)
            const assignee = oneRelation(o.assignee)
            const department = oneRelation(o.department)
            return {
              id: o.id,
              order_number: o.order_number || `ORD-${o.id.slice(0, 6)}`,
              status: o.status,
              order_value: o.order_value,
              expected_delivery_date: o.expected_delivery_date,
              health: o.health,
              companyName: company?.name || '—',
              assigneeName: assignee?.full_name || 'Unassigned',
              departmentName: department?.name || '—',
            }
          })}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5DFD5] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#7A7267]">
              <tr>
                <th className="px-3 py-3 font-semibold">Order</th>
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Campaign</th>
                <th className="px-3 py-3 font-semibold">Value</th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Assigned To</th>
                <th className="px-3 py-3 font-semibold">Expected</th>
                <th className="px-3 py-3 font-semibold">Health</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {rows.map((o) => {
                const company = oneRelation(o.company)
                const assignee = oneRelation(o.assignee)
                const department = oneRelation(o.department)
                const campaign = oneRelation(o.campaign)
                return (
                  <tr key={o.id} className="hover:bg-[#FAF7F2]">
                    <td className="px-3 py-3">
                      <Link href={`/crm/orders/${o.id}`} className="font-mono font-semibold text-[#1A3022] hover:underline">
                        {o.order_number || `ORD-${o.id.slice(0, 6)}`}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{company?.name || '—'}</td>
                    <td className="px-3 py-3">{campaign?.name || '—'}</td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(o.order_value)}</td>
                    <td className="px-3 py-3">{ORDER_STATUS_LABELS[o.status] || o.status}</td>
                    <td className="px-3 py-3">{department?.name || '—'}</td>
                    <td className="px-3 py-3">{assignee?.full_name || 'Unassigned'}</td>
                    <td className="px-3 py-3">{formatDate(o.expected_delivery_date)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${HEALTH_STYLES[o.health]}`}>
                        {HEALTH_LABELS[o.health]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#7A7267]">{formatDate(o.updated_at)}</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-[#7A7267]">No orders match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
