import { createClient } from '@/lib/supabase/server'
import { requireStaff, canSeeFinance, applyOrderScope } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { ORDER_LIFECYCLE, ORDER_STATUS_LABELS, orderHealth } from '@/lib/order-workflow'
import Link from 'next/link'

function Card({ label, value, href, warn }: { label: string; value: string | number; href?: string; warn?: boolean }) {
  const inner = (
    <div className={`rounded-2xl border p-5 ${warn ? 'bg-red-50 border-red-100' : 'bg-white border-[#E5DFD5]'}`}>
      <span className="text-[11px] font-semibold tracking-wider text-[#7A7267] uppercase">{label}</span>
      <p className="font-serif text-2xl text-[#1C1917] mt-3">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default async function DashboardPage() {
  const profile = await requireStaff()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  let orderQuery = supabase
    .from('orders')
    .select('id, status, order_value, expected_delivery_date, assigned_to, current_department_id, stage_due_at, owner_id, company_id')
  orderQuery = applyOrderScope(orderQuery, profile)

  const [
    companies,
    campaigns,
    leads,
    requirements,
    quotations,
    orders,
    invoices,
    payables,
    departments,
    staff,
    tasks,
    followUps,
  ] = await Promise.all([
    supabase.from('companies').select('id, status', { count: 'exact' }),
    supabase.from('campaigns').select('id, status', { count: 'exact' }),
    supabase.from('leads').select('id, stage, owner_id', { count: 'exact' }),
    supabase.from('requirements').select('id, status, owner_id', { count: 'exact' }),
    supabase.from('quotations').select('id, status, total, owner_id', { count: 'exact' }),
    orderQuery,
    canSeeFinance(profile.role)
      ? supabase.from('invoices').select('id, amount, status, order_id')
      : Promise.resolve({ data: [] as { amount: number; status: string; order_id?: string }[] }),
    canSeeFinance(profile.role)
      ? supabase.from('payables').select('amount, status')
      : Promise.resolve({ data: [] as { amount: number; status: string }[] }),
    supabase.from('departments').select('id, name, slug'),
    supabase.from('profiles').select('id, full_name, role, department_id').eq('is_active', true).in('role', ['admin', 'sales', 'operations', 'accounts', 'management']),
    supabase.from('tasks').select('id, status, due_at, assigned_to, completed_at, department_id'),
    supabase.from('activities').select('id, title, type, due_at, status, assigned_to').eq('assigned_to', profile.id).neq('status', 'done').order('due_at', { ascending: true }).limit(6),
  ])

  const orderRows = orders.data || []
  const leadRows = leads.data || []
  const reqRows = requirements.data || []
  const quoteRows = quotations.data || []
  const invoiceRows = invoices.data || []
  const taskRows = tasks.data || []
  const deptRows = departments.data || []
  const staffRows = staff.data || []

  const mine = (ownerId?: string | null) => ownerId === profile.id
  const salesLeads = profile.role === 'sales' ? leadRows.filter((l) => mine(l.owner_id)) : leadRows
  const salesReqs = profile.role === 'sales' ? reqRows.filter((r) => mine(r.owner_id)) : reqRows
  const salesQuotes = profile.role === 'sales' ? quoteRows.filter((q) => mine(q.owner_id)) : quoteRows
  const salesOrders = profile.role === 'sales' ? orderRows.filter((o) => mine(o.owner_id) || o.assigned_to === profile.id) : orderRows

  const totalOrderValue = orderRows.reduce((s, o) => s + Number(o.order_value || 0), 0)
  const inProgress = orderRows.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const delayed = inProgress.filter((o) => orderHealth(o.status, o.expected_delivery_date, o.stage_due_at) === 'delayed')
  const atRisk = inProgress.filter((o) => orderHealth(o.status, o.expected_delivery_date, o.stage_due_at) === 'at_risk')
  const unassigned = inProgress.filter((o) => !o.assigned_to)
  const delivered = orderRows.filter((o) => o.status === 'delivered')
  const invoicedIds = new Set(invoiceRows.map((i) => i.order_id).filter(Boolean))
  const readyToInvoice = delivered.filter((o) => !invoicedIds.has(o.id)).length
  const won = orderRows.filter((o) => !['created', 'cancelled'].includes(o.status)).length
  const lost = reqRows.filter((r) => r.status === 'lost').length
  const quoteToOrder = quoteRows.length ? Math.round((won / quoteRows.length) * 100) : 0
  const reqToQuote = reqRows.length ? Math.round((quoteRows.length / reqRows.length) * 100) : 0
  const invoiced = invoiceRows.reduce((s, i) => s + Number(i.amount || 0), 0)
  const paid = invoiceRows.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0)
  const unpaid = invoiceRows.filter((i) => ['unpaid', 'issued'].includes(i.status))
  const partial = invoiceRows.filter((i) => i.status === 'partially_paid')
  const overdueInv = invoiceRows.filter((i) => i.status === 'overdue')
  const outstanding = invoiced - paid
  const payableTotal = (payables.data || []).reduce((s, p) => s + Number(p.amount || 0), 0)

  const byStage = ORDER_LIFECYCLE.map((st) => {
    const rows = orderRows.filter((o) => o.status === st)
    return {
      st,
      n: rows.length,
      value: rows.reduce((s, o) => s + Number(o.order_value || 0), 0),
      overdue: rows.filter((o) => orderHealth(o.status, o.expected_delivery_date, o.stage_due_at) === 'delayed').length,
    }
  })

  const deptStats = deptRows.map((d) => {
    const rows = orderRows.filter((o) => o.current_department_id === d.id)
    const active = rows.filter((o) => !['delivered', 'cancelled'].includes(o.status))
    const overdue = active.filter((o) => orderHealth(o.status, o.expected_delivery_date, o.stage_due_at) === 'delayed')
    const completed = rows.filter((o) => o.status === 'delivered')
    const unassignedDept = active.filter((o) => !o.assigned_to)
    return { ...d, active: active.length, overdue: overdue.length, completed: completed.length, unassigned: unassignedDept.length }
  })

  const people = staffRows.map((p) => {
    const assigned = inProgress.filter((o) => o.assigned_to === p.id)
    const pending = taskRows.filter((t) => t.assigned_to === p.id && t.status !== 'done' && !t.completed_at)
    const overdue = pending.filter((t) => t.due_at && t.due_at < today)
    const completed = taskRows.filter((t) => t.assigned_to === p.id && (t.status === 'done' || t.completed_at))
    return { ...p, assigned: assigned.length, pending: pending.length, overdue: overdue.length, completed: completed.length }
  }).filter((p) => profile.role === 'admin' || profile.role === 'management' || p.id === profile.id || p.department_id === profile.department_id)

  const greeting = profile.full_name?.split(' ')[0] || 'there'
  const roleTitle =
    profile.role === 'admin' ? 'Organization overview — view all' :
    profile.role === 'management' ? 'Exceptions and performance' :
    profile.role === 'sales' ? 'What needs a follow-up' :
    profile.role === 'operations' ? 'What is pending, delayed, or due' :
    profile.role === 'accounts' ? 'What is ready to invoice or collect' : 'What do I need to do?'

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-[#1C1917]">Good day, {greeting}</h1>
        <p className="text-xs text-[#7A7267] mt-1">{roleTitle}</p>
      </div>

      {(profile.role === 'admin' || profile.role === 'management') && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card label="Clients" value={companies.count || 0} href="/crm/companies" />
            <Card label="Campaigns" value={campaigns.count || 0} href="/crm/campaigns" />
            <Card label="Requirements" value={requirements.count || 0} href="/crm/requirements" />
            <Card label="Quotations" value={quotations.count || 0} href="/crm/quotations" />
            <Card label="Orders" value={orderRows.length} href="/crm/order-management" />
            <Card label="Order value" value={formatCurrency(totalOrderValue)} />
            <Card label="In progress" value={inProgress.length} />
            <Card label="Due soon" value={atRisk.length} href="/crm/order-management?health=at_risk" />
            <Card label="Delayed" value={delayed.length} href="/crm/order-management?health=delayed" warn={delayed.length > 0} />
            <Card label="Delivered" value={delivered.length} />
            {canSeeFinance(profile.role) && <Card label="Outstanding" value={formatCurrency(outstanding)} href="/crm/receivables" />}
            {canSeeFinance(profile.role) && <Card label="Payables" value={formatCurrency(payableTotal)} href="/crm/payables" />}
          </div>

          {profile.role === 'management' && (
            <div className="bg-white rounded-2xl border p-5">
              <h2 className="font-serif text-lg mb-3">Exceptions</h2>
              <p className="text-sm">Delayed: {delayed.length} · At risk: {atRisk.length} · Unassigned: {unassigned.length}</p>
              <Link href="/crm/order-management?health=delayed" className="text-xs underline mt-2 inline-block">Open delayed orders</Link>
            </div>
          )}

          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-serif text-lg">Orders by stage</h2>
              <Link href="/crm/order-management?view=kanban" className="text-xs underline">Kanban</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {byStage.map((s) => (
                <Link key={s.st} href={`/crm/order-management?stage=${s.st}`} className="p-3 rounded-xl bg-[#FAF7F2] border">
                  <p className="text-[11px] text-[#7A7267]">{ORDER_STATUS_LABELS[s.st]}</p>
                  <p className="text-xl font-semibold mt-1">{s.n}</p>
                  <p className="text-[11px] text-[#7A7267]">{formatCurrency(s.value)} · {s.overdue} overdue</p>
                </Link>
              ))}
            </div>
          </div>

          {profile.role === 'admin' && (
            <>
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="font-serif text-lg mb-3">Departments</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  {deptStats.map((d) => (
                    <Link key={d.id} href={`/crm/order-management?department=${d.id}`} className="p-3 rounded-xl border bg-[#FAF7F2]">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-[11px] text-[#7A7267] mt-1">Active {d.active} · Overdue {d.overdue} · Unassigned {d.unassigned} · Done {d.completed}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-6 overflow-x-auto">
                <h2 className="font-serif text-lg mb-3">People</h2>
                <table className="w-full text-xs">
                  <thead className="text-left text-[#7A7267]">
                    <tr><th className="py-2">Employee</th><th>Role</th><th>Assigned orders</th><th>Pending tasks</th><th>Overdue</th><th>Completed</th></tr>
                  </thead>
                  <tbody>
                    {people.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2">{p.full_name}</td>
                        <td>{p.role}</td>
                        <td>{p.assigned}</td>
                        <td>{p.pending}</td>
                        <td className={p.overdue ? 'text-red-700 font-semibold' : ''}>{p.overdue}</td>
                        <td>{p.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {profile.role === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card label="My leads" value={salesLeads.length} href="/crm/leads" />
            <Card label="My requirements" value={salesReqs.filter((r) => r.status === 'active').length} href="/crm/requirements" />
            <Card label="Awaiting response" value={salesQuotes.filter((q) => q.status === 'sent').length} href="/crm/quotations" />
            <Card label="Won orders" value={salesOrders.filter((o) => o.status === 'delivered' || o.status === 'confirmed').length} href="/crm/orders" />
            <Card label="Req → quote" value={`${reqToQuote}%`} />
            <Card label="Quote → order" value={`${quoteToOrder}%`} />
            <Card label="Revenue (won)" value={formatCurrency(salesOrders.reduce((s, o) => s + Number(o.order_value || 0), 0))} />
            <Card label="My work" value="Open" href="/crm/my-work" />
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-serif text-lg mb-2">Upcoming follow-ups</h2>
            {(followUps.data || []).map((a) => (
              <p key={a.id} className="text-sm py-1">{a.type} · {a.title}</p>
            ))}
            {(!followUps.data || followUps.data.length === 0) && <p className="text-sm text-gray-500">No follow-ups due.</p>}
            <Link href="/crm/activities" className="text-xs underline mt-2 inline-block">Activity feed</Link>
          </div>
        </div>
      )}

      {profile.role === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card label="Assigned to me" value={inProgress.filter((o) => o.assigned_to === profile.id).length} href="/crm/my-work" />
            <Card label="Department work" value={inProgress.filter((o) => o.current_department_id === profile.department_id).length} href="/crm/department" />
            <Card label="Delayed" value={delayed.length} href="/crm/order-management?health=delayed" warn={delayed.length > 0} />
            <Card label="Procurement" value={orderRows.filter((o) => o.status === 'procurement').length} href="/crm/order-management?stage=procurement" />
            <Card label="Printing" value={orderRows.filter((o) => o.status === 'printing').length} href="/crm/order-management?stage=printing" />
            <Card label="QC" value={orderRows.filter((o) => o.status === 'quality_check').length} href="/crm/order-management?stage=quality_check" />
            <Card label="Dispatch" value={orderRows.filter((o) => o.status === 'ready_to_dispatch' || o.status === 'dispatched').length} href="/crm/order-management?stage=ready_to_dispatch" />
            <Card label="Kanban" value="Board" href="/crm/order-management?view=kanban" />
          </div>
        </div>
      )}

      {profile.role === 'accounts' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Ready to invoice" value={readyToInvoice} href="/crm/orders" />
          <Card label="Invoices" value={invoiceRows.length} href="/crm/invoices" />
          <Card label="Unpaid" value={unpaid.length} href="/crm/receivables" />
          <Card label="Partial" value={partial.length} href="/crm/receivables" />
          <Card label="Overdue" value={overdueInv.length} href="/crm/receivables" warn={overdueInv.length > 0} />
          <Card label="Received" value={formatCurrency(paid)} href="/crm/payments" />
          <Card label="Outstanding" value={formatCurrency(outstanding)} href="/crm/receivables" />
          <Card label="Payables" value={formatCurrency(payableTotal)} href="/crm/payables" />
        </div>
      )}
    </div>
  )
}
