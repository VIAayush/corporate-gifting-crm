import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { requireStaff } from '@/lib/auth'
import { createTask, completeTask } from './actions'

const PRIORITY_LABELS: Record<number, string> = { 1: 'high', 2: 'medium', 3: 'low' }

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const profile = await requireStaff()
  const supabase = await createClient()

  const { tab = 'my_tasks' } = await searchParams
  let query = supabase.from('tasks').select('*, assignee:profiles!assigned_to(full_name)').order('due_at', { ascending: true })
  if (tab === 'my_tasks' || profile.role === 'sales') query = query.eq('assigned_to', profile.id)
  const [{ data: tasks }, { data: team }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name').not('role', 'in', '(client_admin,client_user)').order('full_name'),
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">Tasks</h1>

      <form action={createTask} className="bg-white border rounded-2xl p-4 grid md:grid-cols-4 gap-3 text-xs">
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
        <input name="description" placeholder="Notes" className="border rounded-lg px-2 py-2 md:col-span-2" />
        <button className="bg-[#1A3022] text-white rounded-lg font-semibold md:col-span-4 py-2">Create task</button>
      </form>

      <div className="flex gap-4 border-b">
        <a href="?tab=my_tasks" className={`pb-2 px-1 text-sm ${tab === 'my_tasks' ? 'font-semibold border-b-2 border-[#1A3022]' : 'text-gray-500'}`}>My Tasks</a>
        {(profile.role === 'admin' || profile.role === 'management' || profile.role === 'operations') && (
          <a href="?tab=all_tasks" className={`pb-2 px-1 text-sm ${tab === 'all_tasks' ? 'font-semibold border-b-2 border-[#1A3022]' : 'text-gray-500'}`}>All Tasks</a>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500">
              <th className="p-3">Title</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assigned To</th>
              <th className="p-3">Due</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(tasks || []).map((task) => {
              const assignee = Array.isArray(task.assignee) ? task.assignee[0] : task.assignee
              const priority = typeof task.priority === 'number' ? PRIORITY_LABELS[task.priority] || String(task.priority) : task.priority
              const overdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done' && !task.completed_at
              return (
                <tr key={task.id} className="border-b">
                  <td className="p-3 font-medium">{task.title}</td>
                  <td className="p-3 capitalize">{priority}</td>
                  <td className="p-3">{assignee?.full_name || 'Unassigned'}</td>
                  <td className={`p-3 ${overdue ? 'text-red-600 font-semibold' : ''}`}>{formatDate(task.due_at)}</td>
                  <td className="p-3 capitalize">{String(task.status || 'open').replace('_', ' ')}</td>
                  <td className="p-3">
                    {task.status !== 'done' && !task.completed_at && (
                      <form action={completeTask}>
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
