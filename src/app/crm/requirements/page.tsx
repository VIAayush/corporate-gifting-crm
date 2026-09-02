import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
}

export default async function RequirementsPage(props: { searchParams: { status?: string } }) {
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status || 'all'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  let query = supabase
    .from('requirements')
    .select('*, company:companies(id, name), owner:profiles(id, full_name)')
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: requirements, error } = await query

  const statuses = ['all', 'active', 'won', 'lost', 'closed']

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Requirements</h1>
        <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90">
          Add Requirement
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {statuses.map(status => (
          <Link 
            key={status}
            href={`/crm/requirements?status=${status}`}
            className={`px-4 py-2 font-medium text-sm capitalize ${statusFilter === status ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {status}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Company</th>
              <th className="p-4 font-medium text-gray-500">Owner</th>
              <th className="p-4 font-medium text-gray-500">Budget</th>
              <th className="p-4 font-medium text-gray-500">Qty</th>
              <th className="p-4 font-medium text-gray-500">Deadline</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requirements?.map((req: any) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <Link href={`/crm/requirements/${req.id}`} className="text-blue-600 hover:underline font-medium">
                    {req.title}
                  </Link>
                </td>
                <td className="p-4">{req.company?.name || '-'}</td>
                <td className="p-4">{req.owner?.full_name || '-'}</td>
                <td className="p-4">{req.budget ? formatCurrency(req.budget) : '-'}</td>
                <td className="p-4">{req.quantity || '-'}</td>
                <td className="p-4">{req.deadline ? formatDate(req.deadline) : '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'}`}>
                    {req.status || 'unknown'}
                  </span>
                </td>
              </tr>
            ))}
            {!requirements?.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">No requirements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}