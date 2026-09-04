import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { requireStaff } from '@/lib/auth'
import { completeTask, createTask, reassignTask, updateTaskStatus } from './actions'
import { asFormAction } from '@/lib/form-action'
import Link from 'next/link'

const PRIORITY_LABELS: Record<number, string> = { 1: 'high', 2: 'medium', 3: 'low' }
const STATUS_OPTIONS = [
  { value: 'open', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>
}) {
  const profile = await requireStaff()
  const supabase = await createClient()
  const canSeeAll = profile.role === 'admin' || profile.role === 'management' || profile.role === 'operations'

  const { tab = 'my_tasks', status = '' } = await searchParams
  const showAll = tab === 'all_tasks' && canSeeAll
  let query = supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(full_name), company:companies(name), order:orders(order_number)')
    .order('due_at', { ascending: true })
  if (!showAll) query = query.eq('assigned_to', profile.id)
  if (status) query = query.eq('status', status)

  const [{ data: tasks }, { data: team }, { data: companies }, { data: orders }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name').not('role', 'in', '(client_admin,client_user)').order('full_name'),
    supabase.from('companies').select('id, name').order('name'),
    supabase.from('orders').select('id, order_number, company_id').order('created_at', { ascending: false }).limit(100),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Tasks</h1>
        <p className="text-xs text-gray-500 mt-1">
          Employees see work assigned to them. Admin and management can view and reassign everything.
        </p>
      </div>

      <form action={asFormAction(createTask)} className="bg-white border rounded-2xl p-4 grid md:grid-cols-4 gap-3 text-xs">
        <input name="title" required placeholder="Task title" className="border rounded-lg px-2 py-2 md:col-span-2" />
        <input name="due_at" type="date" className="border rounded-lg px-2 py-2" />
        <select name="priority" defaultValue="2" className="border rounded-lg px-2 py-2">
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
        <select name="assigned_to" defaultValue={profile.id} className="border rounded-lg px-2 py-2 md:col-span-2">
          {(team || []).map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        <select name="company_id" className="border rounded-lg px-2 py-2">
          <option value="">Company (optional)</option>
          {(companies || []).map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
        <select name="order_id" className="border rounded-lg px-2 py-2">
          <option value="">Related order (optional)</option>
          {(orders || []).map((order) => (
            <option key={order.id} value={order.id}>{order.order_number}</option>
          ))}
        </select>
        <input name="description" placeholder="Notes" className="border rounded-lg px-2 py-2 md:col-span-4" />
        <button className="bg-[#1A3022] text-white rounded-lg font-semibold md:col-span-4 py-2">Create task</button>
      </form>

      <div className="flex flex-wrap gap-4 border-b">
        <Link href="?tab=my_tasks" className={`pb-2 px-1 text-sm ${tab === 'my_tasks' ? 'font-semibold border-b-2 border-[#1A3022]' : 'text-gray-500'}`}>My Tasks</Link>
        {canSeeAll && (
          <Link href="?tab=all_tasks" className={`pb-2 px-1 text-sm ${tab === 'all_tasks' ? 'font-semibold border-b-2 border-[#1A3022]' : 'text-gray-500'}`}>All Tasks</Link>
        )}
        {STATUS_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`?tab=${tab}&status=${option.value}`}
            className={`pb-2 px-1 text-sm ${status === option.value ? 'font-semibold border-b-2 border-[#1A3022]' : 'text-gray-500'}`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="p-3">Title</th>
              <th className="p-3">Company / Order</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assigned To</th>
              <th className="p-3">Due</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(tasks || []).map((task) => {
              const assignee = Array.isArray(task.assignee) ? task.assignee[0] : task.assignee
              const company = Array.isArray(task.company) ? task.company[0] : task.company
              const order = Array.isArray(task.order) ? task.order[0] : task.order
              const priority = typeof task.priority === 'number' ? PRIORITY_LABELS[task.priority] || String(task.priority) : task.priority
              const overdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done' && !task.completed_at
              return (
                <tr key={task.id} className="border-b">
                  <td className="p-3 font-medium">{task.title}</td>
                  <td className="p-3 text-xs text-gray-600">
                    <div>{company?.name || '—'}</div>
                    {order?.order_number && (
                      <Link href={`/crm/orders/${task.order_id}`} className="font-mono text-[#4A235A]">{order.order_number}</Link>
                    )}
                  </td>
                  <td className="p-3 capitalize">{priority}</td>
                  <td className="p-3">
                    {canSeeAll ? (
                      <form action={asFormAction(reassignTask)} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={task.id} />
                        <select name="assigned_to" defaultValue={task.assigned_to || ''} className="border rounded px-1 py-1 text-xs">
                          {(team || []).map((member) => (
                            <option key={member.id} value={member.id}>{member.full_name}</option>
                          ))}
                        </select>
                        <button className="text-[11px] underline">Save</button>
                      </form>
                    ) : (
                      assignee?.full_name || 'Unassigned'
                    )}
                  </td>
                  <td className={`p-3 ${overdue ? 'text-red-600 font-semibold' : ''}`}>{formatDate(task.due_at)}</td>
                  <td className="p-3">
                    <form action={asFormAction(updateTaskStatus)} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={task.id} />
                      <select name="status" defaultValue={task.status || 'open'} className="border rounded px-1 py-1 text-xs">
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <button className="text-[11px] underline">Update</button>
                    </form>
                    {task.status !== 'done' && !task.completed_at && (
                      <form action={asFormAction(completeTask)} className="mt-1">
                        <input type="hidden" name="id" value={task.id} />
                        <button className="text-xs underline">Complete</button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!tasks || tasks.length === 0) && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
