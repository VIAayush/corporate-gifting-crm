import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, orderHealth, HEALTH_LABELS, HEALTH_STYLES } from '@/lib/order-workflow'
import Link from 'next/link'

export default async function MyWorkPage() {
  const profile = await requireStaff()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: tasks }, { data: orders }, { data: followUps }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, due_at, status, priority, order_id, completed_at, orders(order_number)')
      .eq('assigned_to', profile.id)
      .order('due_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_number, status, expected_delivery_date, stage_due_at, order_value, next_action, company:companies(name)')
      .eq('assigned_to', profile.id)
      .order('expected_delivery_date', { ascending: true }),
    supabase
      .from('activities')
      .select('id, type, title, notes, created_at')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const openTasks = (tasks || []).filter((t) => t.status !== 'done' && !t.completed_at)
  const todayTasks = openTasks.filter((t) => t.due_at && t.due_at <= today)
  const upcomingTasks = openTasks.filter((t) => t.due_at && t.due_at > today)
  const overdueTasks = openTasks.filter((t) => t.due_at && t.due_at < today)
  const completed = (tasks || []).filter((t) => t.status === 'done' || t.completed_at).slice(0, 8)
  const myOrders = orders || []
  const overdueOrders = myOrders.filter((o) => orderHealth(o.status, o.expected_delivery_date, o.stage_due_at) === 'delayed')

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl border border-[#E5DFD5] p-5 space-y-3">
      <h2 className="font-serif text-lg text-[#1C1917]">{title}</h2>
      {children}
    </section>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">My Work</h1>
        <p className="text-xs text-[#7A7267] mt-1">Assigned orders, tasks, and follow-ups for {profile.full_name || profile.email}.</p>
      </div>

      <Section title="Today">
        <p className="text-[11px] uppercase tracking-wider text-[#7A7267]">Tasks due today or earlier</p>
        {(todayTasks.length === 0 && myOrders.length === 0) && <p className="text-sm text-gray-500">Nothing due right now.</p>}
        {todayTasks.map((t) => {
          const ord = Array.isArray(t.orders) ? t.orders[0] : t.orders
          return (
            <Link key={t.id} href={t.order_id ? `/crm/orders/${t.order_id}` : '/crm/tasks'} className="block p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0]">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-[11px] text-[#7A7267] mt-0.5">{ord?.order_number || 'Task'} · due {formatDate(t.due_at)}</p>
            </Link>
          )
        })}
        {myOrders.slice(0, 6).map((o) => {
          const company = Array.isArray(o.company) ? o.company[0] : o.company
          const health = orderHealth(o.status, o.expected_delivery_date, o.stage_due_at)
          return (
            <Link key={o.id} href={`/crm/orders/${o.id}`} className="flex items-center justify-between p-3 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2]">
              <div>
                <p className="text-sm font-semibold font-mono">{o.order_number}</p>
                <p className="text-[11px] text-[#7A7267]">{company?.name} · {ORDER_STATUS_LABELS[o.status] || o.status}</p>
                {o.next_action && <p className="text-[11px] mt-1">{o.next_action}</p>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${HEALTH_STYLES[health]}`}>{HEALTH_LABELS[health]}</span>
            </Link>
          )
        })}
      </Section>

      <Section title="Upcoming">
        {upcomingTasks.length === 0 && <p className="text-sm text-gray-500">No upcoming tasks.</p>}
        {upcomingTasks.map((t) => (
          <div key={t.id} className="text-sm flex justify-between border-b border-[#EFE9E0] py-2">
            <span>{t.title}</span>
            <span className="text-[#7A7267]">{formatDate(t.due_at)}</span>
          </div>
        ))}
      </Section>

      <Section title="Overdue">
        {overdueTasks.length === 0 && overdueOrders.length === 0 && <p className="text-sm text-gray-500">No overdue work.</p>}
        {overdueOrders.map((o) => (
          <Link key={o.id} href={`/crm/orders/${o.id}`} className="block text-sm text-red-800 py-1">{o.order_number} · {formatCurrency(o.order_value)}</Link>
        ))}
        {overdueTasks.map((t) => (
          <p key={t.id} className="text-sm text-red-800">{t.title} · {formatDate(t.due_at)}</p>
        ))}
      </Section>

      <Section title="Completed">
        {completed.length === 0 && <p className="text-sm text-gray-500">No recently completed tasks.</p>}
        {completed.map((t) => (
          <p key={t.id} className="text-sm text-[#7A7267]">{t.title}</p>
        ))}
        {(followUps || []).length > 0 && (
          <div className="pt-3">
            <p className="text-[11px] uppercase text-[#7A7267] mb-2">Recent follow-ups</p>
            {(followUps || []).map((a) => (
              <p key={a.id} className="text-xs text-[#5A5248] py-1">{a.type || 'note'} · {a.title || a.notes || ''}</p>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
