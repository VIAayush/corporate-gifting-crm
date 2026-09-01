import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function PortalRequirementsPage() {
  const supabase = await createClient()
  
  const { data: companyId } = await supabase.rpc('client_company_id')
  
  const { data: requirements } = await supabase
    .from('requirements')
    .select('*, requirement_items(id)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requirements</h1>
          <p className="mt-2 text-gray-600">Track and manage your gifting requirements.</p>
        </div>
        <Link 
          href="/portal/requirements/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#4A235A] rounded-md hover:bg-[#3d1c4a] transition-colors shadow-sm"
        >
          Create New Requirement
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {requirements?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No requirements found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Budget/Unit</th>
                  <th className="px-6 py-4 font-semibold">Quantity</th>
                  <th className="px-6 py-4 font-semibold">Deadline</th>
                  <th className="px-6 py-4 font-semibold">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requirements?.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {req.name}
                      <div className="text-xs text-gray-500 font-normal mt-1">{req.purpose}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        req.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'quoting' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">${Number(req.budget_per_unit || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">{req.quantity}</td>
                    <td className="px-6 py-4">
                      {req.deadline ? format(new Date(req.deadline), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(req.created_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
