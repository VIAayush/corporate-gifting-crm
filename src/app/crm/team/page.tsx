import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin' && profile?.role !== 'management') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <h2 className="font-bold mb-1">Access Denied</h2>
          <p className="text-sm">You do not have permission to view the team directory.</p>
        </div>
      </div>
    )
  }

  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    management: 'bg-blue-100 text-blue-800',
    sales: 'bg-green-100 text-green-800',
    operations: 'bg-amber-100 text-amber-800',
    accounts: 'bg-indigo-100 text-indigo-800'
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Team Directory</h1>
      </div>
      
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50">
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Name</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Email</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Role</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Status</th>
              <th className="p-3 font-medium text-sm text-[var(--color-text-secondary)]">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{p.full_name}</td>
                <td className="p-3 text-sm">{p.email}</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${roleColors[p.role] || 'bg-gray-100 text-gray-800'}`}>
                    {p.role}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Active</span>
                </td>
                <td className="p-3 text-sm">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}