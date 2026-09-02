import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function TasksPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab = searchParams.tab || 'my_tasks'
  let query = supabase.from('tasks').select('*, assignee:assigned_to(full_name), creator:created_by(full_name)').order('due_date', { ascending: true })
  
  if (tab === 'my_tasks') {
    query = query.eq('assigned_to', user.id)
  }

  const { data: tasks } = await query

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Tasks</h1>
      </div>
      
      <div className="flex gap-4 mb-6 border-b border-[var(--color-border)]">
        <a href="?tab=my_tasks" className={`pb-2 px-1 font-medium ${tab === 'my_tasks' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-black'}`}>My Tasks</a>
        <a href="?tab=all_tasks" className={`pb-2 px-1 font-medium ${tab === 'all_tasks' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-black'}`}>All Tasks</a>
      </div>

      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Title</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Priority</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Assigned To</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Due Date</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.map(task => (
              <tr key={task.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{task.title}</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-3 text-sm">{task.assignee?.full_name || 'Unassigned'}</td>
                <td className={`p-3 text-sm ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600 font-semibold' : ''}`}>
                  {formatDate(task.due_date)}
                </td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-[var(--color-text-secondary)]">No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}